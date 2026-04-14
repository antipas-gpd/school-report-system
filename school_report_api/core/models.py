from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


# ─── Role Constants ───────────────────────────────────────────────────────────

class Role(models.TextChoices):
    ADMIN   = 'admin',   'Admin (Headmaster)'
    TEACHER = 'teacher', 'Teacher'
    BURSAR  = 'bursar',  'Bursar'
    PARENT  = 'parent',  'Parent'


# ─── User ─────────────────────────────────────────────────────────────────────

class User(AbstractUser):
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.TEACHER,
    )

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    # Convenience helpers
    @property
    def is_admin(self):
        return self.role == Role.ADMIN

    @property
    def is_teacher(self):
        return self.role == Role.TEACHER

    @property
    def is_bursar(self):
        return self.role == Role.BURSAR

    @property
    def is_parent(self):
        return self.role == Role.PARENT


# ─── Student ──────────────────────────────────────────────────────────────────

class Student(models.Model):
    first_name   = models.CharField(max_length=100)
    last_name    = models.CharField(max_length=100)
    student_id   = models.CharField(max_length=20, unique=True)
    date_of_birth = models.DateField(null=True, blank=True)
    class_name   = models.CharField(max_length=50, help_text="e.g. Grade 7A")
    parent       = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='children',
        limit_choices_to={'role': Role.PARENT},
    )
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.student_id})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


# ─── Subject ──────────────────────────────────────────────────────────────────

class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.code} - {self.name}"


# ─── Mark ─────────────────────────────────────────────────────────────────────

GRADE_BOUNDARIES = [
    (80, 'A'),
    (65, 'B'),
    (50, 'C'),
    (0,  'D'),
]

def compute_grade(score: float) -> str:
    for threshold, grade in GRADE_BOUNDARIES:
        if score >= threshold:
            return grade
    return 'D'


class Mark(models.Model):
    student  = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='marks')
    subject  = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='marks')
    score    = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Score out of 100",
    )
    grade    = models.CharField(max_length=2, editable=False)
    term     = models.CharField(max_length=20, default='Term 1')
    recorded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='recorded_marks',
        limit_choices_to={'role': Role.TEACHER},
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'subject', 'term')
        ordering = ['subject__name']

    def save(self, *args, **kwargs):
        self.grade = compute_grade(self.score)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student} | {self.subject.name}: {self.score} ({self.grade})"


# ─── Attendance ───────────────────────────────────────────────────────────────

class Attendance(models.Model):
    student     = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    date        = models.DateField()
    is_present  = models.BooleanField(default=True)
    recorded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='recorded_attendance',
    )
    note        = models.CharField(max_length=200, blank=True)

    class Meta:
        unique_together = ('student', 'date')
        ordering = ['-date']

    def __str__(self):
        status = "Present" if self.is_present else "Absent"
        return f"{self.student} | {self.date} — {status}"


# ─── Fee ──────────────────────────────────────────────────────────────────────

class Fee(models.Model):
    student     = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='fee')
    total       = models.DecimalField(max_digits=10, decimal_places=2)
    paid        = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    term        = models.CharField(max_length=20, default='Term 1')
    updated_at  = models.DateTimeField(auto_now=True)
    updated_by  = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='updated_fees',
        limit_choices_to={'role': Role.BURSAR},
    )

    class Meta:
        ordering = ['student__last_name']

    @property
    def balance(self):
        return self.total - self.paid

    @property
    def is_fully_paid(self):
        return self.paid >= self.total

    def __str__(self):
        status = "✓ PAID" if self.is_fully_paid else f"Balance: {self.balance}"
        return f"{self.student} | {status}"


# ─── Report ───────────────────────────────────────────────────────────────────

class Report(models.Model):
    student      = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='reports')
    term         = models.CharField(max_length=20, default='Term 1')
    generated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='generated_reports',
    )
    approved     = models.BooleanField(default=False)
    approved_by  = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='approved_reports',
        limit_choices_to={'role': Role.ADMIN},
    )
    approved_at  = models.DateTimeField(null=True, blank=True)
    ai_comment   = models.TextField(blank=True)
    teacher_comment = models.TextField(blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'term')
        ordering = ['-created_at']

    def __str__(self):
        status = "✓ Approved" if self.approved else "Pending"
        return f"Report: {self.student} | {self.term} [{status}]"
