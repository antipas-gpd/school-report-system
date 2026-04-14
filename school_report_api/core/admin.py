from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Student, Subject, Mark, Attendance, Fee, Report


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ('username', 'email', 'role', 'is_active', 'date_joined')
    list_filter   = ('role', 'is_active', 'is_staff')
    fieldsets     = BaseUserAdmin.fieldsets + (
        ('Role', {'fields': ('role',)}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Role', {'fields': ('role',)}),
    )


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display  = ('student_id', 'full_name', 'class_name', 'parent')
    list_filter   = ('class_name',)
    search_fields = ('student_id', 'first_name', 'last_name')


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('code', 'name')


@admin.register(Mark)
class MarkAdmin(admin.ModelAdmin):
    list_display  = ('student', 'subject', 'score', 'grade', 'term', 'recorded_by')
    list_filter   = ('grade', 'term', 'subject')
    search_fields = ('student__first_name', 'student__last_name')


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'date', 'is_present', 'recorded_by')
    list_filter  = ('is_present', 'date')


@admin.register(Fee)
class FeeAdmin(admin.ModelAdmin):
    list_display  = ('student', 'total', 'paid', 'balance', 'is_fully_paid', 'term')
    list_filter   = ('term',)
    search_fields = ('student__first_name', 'student__last_name')
    readonly_fields = ('balance', 'is_fully_paid')


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display  = ('student', 'term', 'generated_by', 'approved', 'approved_by', 'created_at')
    list_filter   = ('approved', 'term')
    search_fields = ('student__first_name', 'student__last_name')
    readonly_fields = ('created_at', 'updated_at')
