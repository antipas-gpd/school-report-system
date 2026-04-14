"""
Role-based permission classes.
All require authentication first; then check the user's role.
"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Only the Admin (Headmaster) role."""
    message = "Only administrators can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)


class IsTeacher(BasePermission):
    """Only Teachers."""
    message = "Only teachers can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_teacher)


class IsBursar(BasePermission):
    """Only Bursars."""
    message = "Only bursars can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_bursar)


class IsParent(BasePermission):
    """Only Parents."""
    message = "Only parents can access this resource."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_parent)


class IsAdminOrTeacher(BasePermission):
    """Admin or Teacher."""
    message = "Only administrators or teachers can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and (request.user.is_admin or request.user.is_teacher)
        )


class IsAdminOrBursar(BasePermission):
    """Admin or Bursar."""
    message = "Only administrators or bursars can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and (request.user.is_admin or request.user.is_bursar)
        )


class IsAdminOrTeacherOrReadOnly(BasePermission):
    """
    Read: Admin, Teacher, Bursar, Parent (authenticated).
    Write: Admin, Teacher only.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user.is_admin or request.user.is_teacher
