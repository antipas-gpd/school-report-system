from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, StudentViewSet, SubjectViewSet,
    MarkViewSet, AttendanceViewSet, FeeViewSet,
    ReportViewSet, GenerateReportView, ApproveReportView,
    TeacherCommentView,
)

router = DefaultRouter()
router.register(r'users',      UserViewSet,      basename='user')
router.register(r'students',   StudentViewSet,   basename='student')
router.register(r'subjects',   SubjectViewSet,   basename='subject')
router.register(r'marks',      MarkViewSet,      basename='mark')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'fees',       FeeViewSet,       basename='fee')
router.register(r'reports',    ReportViewSet,    basename='report')

urlpatterns = [
    path('', include(router.urls)),

    # Report generation & approval
    path('generate-report/<int:student_id>/', GenerateReportView.as_view(),  name='generate-report'),
    path('approve-report/<int:report_id>/',   ApproveReportView.as_view(),   name='approve-report'),
    path('reports/<int:report_id>/comment/',  TeacherCommentView.as_view(),  name='report-comment'),
]
