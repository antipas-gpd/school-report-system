from rest_framework import serializers
from core.models import User, Student, Subject, Mark, Attendance, Fee, Report


# ─── User ─────────────────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'password')

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UserMinimalSerializer(serializers.ModelSerializer):
    """Lightweight user info for nested display."""
    class Meta:
        model  = User
        fields = ('id', 'username', 'email', 'role')


# ─── Student ──────────────────────────────────────────────────────────────────

class StudentSerializer(serializers.ModelSerializer):
    parent_detail = UserMinimalSerializer(source='parent', read_only=True)

    class Meta:
        model  = Student
        fields = (
            'id', 'student_id', 'first_name', 'last_name', 'full_name',
            'date_of_birth', 'class_name', 'parent', 'parent_detail', 'created_at',
        )
        read_only_fields = ('full_name', 'created_at')


# ─── Subject ──────────────────────────────────────────────────────────────────

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Subject
        fields = ('id', 'code', 'name')


# ─── Mark ─────────────────────────────────────────────────────────────────────

class MarkSerializer(serializers.ModelSerializer):
    grade           = serializers.CharField(read_only=True)
    subject_detail  = SubjectSerializer(source='subject', read_only=True)
    student_name    = serializers.CharField(source='student.full_name', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.username', read_only=True)

    class Meta:
        model  = Mark
        fields = (
            'id', 'student', 'student_name', 'subject', 'subject_detail',
            'score', 'grade', 'term', 'recorded_by', 'recorded_by_name',
            'created_at', 'updated_at',
        )
        read_only_fields = ('grade', 'created_at', 'updated_at')

    def validate_score(self, value):
        if not (0 <= value <= 100):
            raise serializers.ValidationError("Score must be between 0 and 100.")
        return value


# ─── Attendance ───────────────────────────────────────────────────────────────

class AttendanceSerializer(serializers.ModelSerializer):
    student_name    = serializers.CharField(source='student.full_name', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.username', read_only=True)

    class Meta:
        model  = Attendance
        fields = (
            'id', 'student', 'student_name', 'date', 'is_present',
            'recorded_by', 'recorded_by_name', 'note',
        )


# ─── Fee ──────────────────────────────────────────────────────────────────────

class FeeSerializer(serializers.ModelSerializer):
    balance         = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_fully_paid   = serializers.BooleanField(read_only=True)
    student_name    = serializers.CharField(source='student.full_name', read_only=True)

    class Meta:
        model  = Fee
        fields = (
            'id', 'student', 'student_name', 'total', 'paid',
            'balance', 'is_fully_paid', 'term', 'updated_at',
        )
        read_only_fields = ('balance', 'is_fully_paid', 'updated_at')

    def validate(self, data):
        total = data.get('total', getattr(self.instance, 'total', None))
        paid  = data.get('paid',  getattr(self.instance, 'paid',  0))
        if paid is not None and total is not None and paid > total:
            raise serializers.ValidationError("Paid amount cannot exceed total fees.")
        return data


# ─── Report ───────────────────────────────────────────────────────────────────

class ReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(source='generated_by.username', read_only=True)
    approved_by_name  = serializers.CharField(source='approved_by.username',  read_only=True)
    student_name      = serializers.CharField(source='student.full_name',     read_only=True)

    class Meta:
        model  = Report
        fields = (
            'id', 'student', 'student_name', 'term',
            'generated_by', 'generated_by_name',
            'approved', 'approved_by', 'approved_by_name', 'approved_at',
            'ai_comment', 'teacher_comment',
            'created_at', 'updated_at',
        )
        read_only_fields = ('approved', 'approved_by', 'approved_at', 'created_at', 'updated_at')


# ─── Report Detail (full report payload) ─────────────────────────────────────

class MarkInReportSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name')
    subject_code = serializers.CharField(source='subject.code')

    class Meta:
        model  = Mark
        fields = ('subject_code', 'subject_name', 'score', 'grade')


class ReportDetailSerializer(serializers.Serializer):
    """Full report output for GET /api/generate-report/<student_id>/"""
    report_id        = serializers.IntegerField()
    student_id       = serializers.CharField()
    student_name     = serializers.CharField()
    class_name       = serializers.CharField()
    term             = serializers.CharField()
    generated_by     = serializers.CharField()
    approved         = serializers.BooleanField()
    marks            = MarkInReportSerializer(many=True)
    total_score      = serializers.FloatField()
    average_score    = serializers.FloatField()
    attendance_total = serializers.IntegerField()
    attendance_present = serializers.IntegerField()
    attendance_pct   = serializers.FloatField()
    fees_total       = serializers.DecimalField(max_digits=10, decimal_places=2)
    fees_paid        = serializers.DecimalField(max_digits=10, decimal_places=2)
    fees_balance     = serializers.DecimalField(max_digits=10, decimal_places=2)
    fees_fully_paid  = serializers.BooleanField()
    ai_comment       = serializers.CharField()
    teacher_comment  = serializers.CharField()
    created_at       = serializers.DateTimeField()
