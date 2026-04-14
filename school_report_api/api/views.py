"""
API Views for School Report Management System
"""
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from core.models import User, Student, Subject, Mark, Attendance, Fee, Report
from .serializers import (
    UserSerializer, StudentSerializer, SubjectSerializer,
    MarkSerializer, AttendanceSerializer, FeeSerializer,
    ReportSerializer, ReportDetailSerializer,
)
from .permissions import (
    IsAdmin, IsTeacher, IsBursar, IsParent,
    IsAdminOrTeacher, IsAdminOrBursar, IsAdminOrTeacherOrReadOnly,
)
from .ai_comments import generate_ai_comment


# ─── User Management (Admin only) ─────────────────────────────────────────────

class UserViewSet(viewsets.ModelViewSet):
    """
    CRUD for users. Admin only.
    GET    /api/users/
    POST   /api/users/
    GET    /api/users/{id}/
    PUT    /api/users/{id}/
    PATCH  /api/users/{id}/
    DELETE /api/users/{id}/
    """
    queryset         = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    filter_backends  = [filters.SearchFilter]
    search_fields    = ['username', 'email', 'role']

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """GET /api/users/me/ — current user profile."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# ─── Student Management ───────────────────────────────────────────────────────

class StudentViewSet(viewsets.ModelViewSet):
    """
    CRUD for students.
    Admin & Teacher: full access.
    Parent: can only see their own children.
    Bursar: read-only.
    """
    serializer_class = StudentSerializer
    filter_backends  = [filters.SearchFilter]
    search_fields    = ['first_name', 'last_name', 'student_id', 'class_name']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrTeacher()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs   = Student.objects.select_related('parent').all()
        if user.is_parent:
            return qs.filter(parent=user)
        return qs


# ─── Subject Management ───────────────────────────────────────────────────────

class SubjectViewSet(viewsets.ModelViewSet):
    """
    Admin & Teacher: CRUD.
    Others: read-only.
    """
    queryset         = Subject.objects.all()
    serializer_class = SubjectSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrTeacher()]
        return [IsAuthenticated()]


# ─── Mark Management ──────────────────────────────────────────────────────────

class MarkViewSet(viewsets.ModelViewSet):
    """
    Teacher records marks; Admin can do anything.
    Parents cannot access marks directly (only via report).
    """
    serializer_class = MarkSerializer
    filter_backends  = [filters.SearchFilter]
    search_fields    = ['student__first_name', 'student__last_name', 'term']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrTeacher()]
        if self.action in ('list', 'retrieve'):
            return [IsAdminOrTeacher()]
        return [IsAdmin()]

    def get_queryset(self):
        qs = Mark.objects.select_related('student', 'subject', 'recorded_by').all()
        student_id = self.request.query_params.get('student')
        term       = self.request.query_params.get('term')
        if student_id:
            qs = qs.filter(student_id=student_id)
        if term:
            qs = qs.filter(term=term)
        return qs

    def perform_create(self, serializer):
        # Automatically tag which teacher recorded this mark
        if self.request.user.is_teacher:
            serializer.save(recorded_by=self.request.user)
        else:
            serializer.save()


# ─── Attendance Management ────────────────────────────────────────────────────

class AttendanceViewSet(viewsets.ModelViewSet):
    """
    Teacher records attendance; Admin can do anything.
    """
    serializer_class   = AttendanceSerializer
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['student__first_name', 'student__last_name']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrTeacher()]
        return [IsAdminOrTeacher()]

    def get_queryset(self):
        qs = Attendance.objects.select_related('student', 'recorded_by').all()
        student_id = self.request.query_params.get('student')
        date       = self.request.query_params.get('date')
        if student_id:
            qs = qs.filter(student_id=student_id)
        if date:
            qs = qs.filter(date=date)
        return qs

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)


# ─── Fee Management (Bursar) ──────────────────────────────────────────────────

class FeeViewSet(viewsets.ModelViewSet):
    """
    Bursar & Admin: full access.
    Teacher: read-only.
    Parent: cannot access.
    """
    serializer_class = FeeSerializer
    filter_backends  = [filters.SearchFilter]
    search_fields    = ['student__first_name', 'student__last_name']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrBursar()]
        return [IsAdminOrBursar()]

    def get_queryset(self):
        qs = Fee.objects.select_related('student', 'updated_by').all()
        student_id = self.request.query_params.get('student')
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


# ─── Report Management ────────────────────────────────────────────────────────

class ReportViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List and retrieve reports.
    Admin: all reports.
    Teacher: reports they generated.
    Parent: reports of their children (only if fees paid).
    """
    serializer_class = ReportSerializer

    def get_queryset(self):
        user = self.request.user
        qs   = Report.objects.select_related(
            'student', 'generated_by', 'approved_by'
        ).all()

        if user.is_admin:
            return qs

        if user.is_teacher:
            return qs.filter(generated_by=user)

        if user.is_parent:
            # Filter to parent's children and fee-paid only
            children = Student.objects.filter(parent=user)
            paid_children = [
                s.id for s in children
                if hasattr(s, 'fee') and s.fee.is_fully_paid
            ]
            return qs.filter(student_id__in=paid_children)

        return qs.none()


# ─── Generate Report ──────────────────────────────────────────────────────────

class GenerateReportView(APIView):
    """
    GET /api/generate-report/<student_id>/
    Optional query param: ?term=Term+1

    - Teacher or Admin can generate.
    - Parent can VIEW if fees are paid.
    - Creates or refreshes the Report record.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        user = request.user

        # ── Fetch student ──────────────────────────────────────────────────
        try:
            student = Student.objects.select_related('parent', 'fee').get(id=student_id)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        term = request.query_params.get('term', 'Term 1')

        # ── Role-based access control ──────────────────────────────────────
        if user.is_parent:
            # Parent can only view their own child's report
            if student.parent_id != user.id:
                return Response(
                    {'error': 'You can only view reports for your own children.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Check fees
            if not (hasattr(student, 'fee') and student.fee.is_fully_paid):
                return Response(
                    {
                        'error': 'Access denied.',
                        'detail': 'Report is locked until school fees are fully paid.',
                        'fees_status': {
                            'total':   str(student.fee.total)   if hasattr(student, 'fee') else None,
                            'paid':    str(student.fee.paid)    if hasattr(student, 'fee') else None,
                            'balance': str(student.fee.balance) if hasattr(student, 'fee') else None,
                        }
                    },
                    status=status.HTTP_402_PAYMENT_REQUIRED
                )

        elif not (user.is_admin or user.is_teacher):
            return Response(
                {'error': 'You do not have permission to access reports.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # ── Gather marks ───────────────────────────────────────────────────
        marks = Mark.objects.filter(student=student, term=term).select_related('subject')
        scores = [m.score for m in marks]
        total_score   = sum(scores)
        average_score = (total_score / len(scores)) if scores else 0.0

        # ── Gather attendance ──────────────────────────────────────────────
        attendance_records = Attendance.objects.filter(student=student)
        att_total   = attendance_records.count()
        att_present = attendance_records.filter(is_present=True).count()
        att_pct     = (att_present / att_total * 100) if att_total > 0 else 0.0

        # ── Fee status ─────────────────────────────────────────────────────
        fee = getattr(student, 'fee', None)
        fees_total      = fee.total       if fee else 0
        fees_paid       = fee.paid        if fee else 0
        fees_balance    = fee.balance     if fee else 0
        fees_fully_paid = fee.is_fully_paid if fee else False

        # ── AI Comment ─────────────────────────────────────────────────────
        ai_comment = generate_ai_comment(average_score, att_pct)

        # ── Create or update Report record ─────────────────────────────────
        generated_by = user if (user.is_teacher or user.is_admin) else None
        report, created = Report.objects.get_or_create(
            student=student, term=term,
            defaults={
                'generated_by': generated_by,
                'ai_comment':   ai_comment,
            }
        )
        if not created and generated_by:
            # Refresh AI comment and tracker on re-generation
            report.ai_comment   = ai_comment
            report.generated_by = generated_by
            report.save(update_fields=['ai_comment', 'generated_by', 'updated_at'])

        # ── Build response ─────────────────────────────────────────────────
        payload = {
            'report_id':          report.id,
            'student_id':         student.student_id,
            'student_name':       student.full_name,
            'class_name':         student.class_name,
            'term':               term,
            'generated_by':       generated_by.username if generated_by else report.generated_by.username if report.generated_by else 'N/A',
            'approved':           report.approved,
            'marks':              marks,
            'total_score':        round(total_score, 2),
            'average_score':      round(average_score, 2),
            'attendance_total':   att_total,
            'attendance_present': att_present,
            'attendance_pct':     round(att_pct, 2),
            'fees_total':         fees_total,
            'fees_paid':          fees_paid,
            'fees_balance':       fees_balance,
            'fees_fully_paid':    fees_fully_paid,
            'ai_comment':         report.ai_comment,
            'teacher_comment':    report.teacher_comment,
            'created_at':         report.created_at,
        }

        serializer = ReportDetailSerializer(payload)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ─── Approve Report (Admin only) ──────────────────────────────────────────────

class ApproveReportView(APIView):
    """
    POST /api/approve-report/<report_id>/
    Admin only. Marks a report as approved and records who approved it.
    """
    permission_classes = [IsAdmin]

    def post(self, request, report_id):
        try:
            report = Report.objects.select_related('student', 'generated_by').get(id=report_id)
        except Report.DoesNotExist:
            return Response(
                {'error': 'Report not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if report.approved:
            return Response(
                {
                    'message': 'Report is already approved.',
                    'approved_by': report.approved_by.username if report.approved_by else None,
                    'approved_at': report.approved_at,
                },
                status=status.HTTP_200_OK
            )

        report.approved    = True
        report.approved_by = request.user
        report.approved_at = timezone.now()
        report.save(update_fields=['approved', 'approved_by', 'approved_at'])

        return Response(
            {
                'message': 'Report approved successfully.',
                'report_id':   report.id,
                'student':     report.student.full_name,
                'term':        report.term,
                'approved_by': request.user.username,
                'approved_at': report.approved_at,
            },
            status=status.HTTP_200_OK
        )


# ─── Teacher Comment (Teacher or Admin) ───────────────────────────────────────

class TeacherCommentView(APIView):
    """
    PATCH /api/reports/<report_id>/comment/
    Teacher or Admin can add/update a comment on a report.
    """
    permission_classes = [IsAdminOrTeacher]

    def patch(self, request, report_id):
        try:
            report = Report.objects.get(id=report_id)
        except Report.DoesNotExist:
            return Response({'error': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)

        comment = request.data.get('teacher_comment', '').strip()
        if not comment:
            return Response({'error': 'teacher_comment is required.'}, status=status.HTTP_400_BAD_REQUEST)

        report.teacher_comment = comment
        report.save(update_fields=['teacher_comment', 'updated_at'])

        return Response({
            'message': 'Comment updated.',
            'report_id': report.id,
            'teacher_comment': report.teacher_comment,
        })
