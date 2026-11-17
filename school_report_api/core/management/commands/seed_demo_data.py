"""
Management command: python manage.py seed_demo_data
Creates demo users, students, subjects, marks, attendance, and fees.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
import random

from core.models import User, Student, Subject, Mark, Attendance, Fee, Role


SUBJECTS = [
    ('MATH', 'Mathematics'),
    ('ENG',  'English Language'),
    ('SCI',  'General Science'),
    ('HIST', 'History'),
    ('GEO',  'Geography'),
    ('PHY',  'Physical Education'),
]


class Command(BaseCommand):
    help = 'Seeds the database with demo data for testing'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('\n🌱  Seeding demo data...\n'))

        # ── Users ──────────────────────────────────────────────────────────
        admin = self._create_user('headmaster', 'admin@school.edu', 'Admin123!', Role.ADMIN, 'Dr.', 'Smith')
        teacher1 = self._create_user('ms_johnson', 'johnson@school.edu', 'Teacher123!', Role.TEACHER, 'Ms.', 'Johnson')
        teacher2 = self._create_user('mr_osei', 'osei@school.edu', 'Teacher123!', Role.TEACHER, 'Mr.', 'Osei')
        bursar = self._create_user('bursar_kate', 'bursar@school.edu', 'Bursar123!', Role.BURSAR, 'Mrs.', 'Williams')
        parent1 = self._create_user('parent_alice', 'alice@gmail.com', 'Parent123!', Role.PARENT, 'Mrs.', 'Mensah')
        parent2 = self._create_user('parent_bob',   'bob@gmail.com',   'Parent123!', Role.PARENT, 'Mr.',  'Asante')

        self.stdout.write(self.style.SUCCESS('  ✓ Users created'))

        # ── Subjects ───────────────────────────────────────────────────────
        subjects = []
        for code, name in SUBJECTS:
            subj, _ = Subject.objects.get_or_create(code=code, defaults={'name': name})
            subjects.append(subj)

        self.stdout.write(self.style.SUCCESS('  ✓ Subjects created'))

        # ── Students ───────────────────────────────────────────────────────
        student_data = [
            ('S001', 'Kwame',   'Mensah',  'Grade 8A', parent1, True),   # fees paid
            ('S002', 'Abena',   'Mensah',  'Grade 8A', parent1, False),  # fees unpaid
            ('S003', 'Kofi',    'Asante',  'Grade 7B', parent2, True),   # fees paid
            ('S004', 'Akosua',  'Asante',  'Grade 7B', parent2, True),   # fees paid
            ('S005', 'Yaw',     'Boateng', 'Grade 8A', None,    True),
        ]

        students = []
        for sid, fn, ln, cls, parent, fees_paid in student_data:
            student, _ = Student.objects.get_or_create(
                student_id=sid,
                defaults={
                    'first_name': fn,
                    'last_name':  ln,
                    'class_name': cls,
                    'parent':     parent,
                    'date_of_birth': date(2012, random.randint(1, 12), random.randint(1, 28)),
                }
            )
            students.append((student, fees_paid))

        self.stdout.write(self.style.SUCCESS('  ✓ Students created'))

        # ── Marks ──────────────────────────────────────────────────────────
        score_map = {
            'S001': [85, 78, 92, 70, 88, 95],   # High performer
            'S002': [45, 52, 38, 60, 49, 55],   # Struggling
            'S003': [70, 68, 75, 72, 66, 80],   # Average
            'S004': [90, 95, 88, 92, 85, 97],   # Excellent
            'S005': [55, 60, 58, 65, 50, 62],   # Below average
        }
        teachers = [teacher1, teacher2]
        for student, _ in students:
            scores = score_map.get(student.student_id, [60]*6)
            for i, subj in enumerate(subjects):
                Mark.objects.get_or_create(
                    student=student, subject=subj, term='Term 1',
                    defaults={
                        'score':       scores[i],
                        'recorded_by': teachers[i % 2],
                    }
                )

        self.stdout.write(self.style.SUCCESS('  ✓ Marks recorded'))

        # ── Attendance (last 30 days) ───────────────────────────────────────
        today = date.today()
        absent_days = {
            'S001': 2, 'S002': 10, 'S003': 5, 'S004': 1, 'S005': 8,
        }
        for student, _ in students:
            absences = absent_days.get(student.student_id, 3)
            absent_set = set(random.sample(range(30), absences))
            for day_offset in range(30):
                record_date = today - timedelta(days=day_offset)
                if record_date.weekday() >= 5:  # Skip weekends
                    continue
                Attendance.objects.get_or_create(
                    student=student, date=record_date,
                    defaults={
                        'is_present':  day_offset not in absent_set,
                        'recorded_by': teacher1,
                    }
                )

        self.stdout.write(self.style.SUCCESS('  ✓ Attendance recorded'))

        # ── Fees ───────────────────────────────────────────────────────────
        fee_configs = {
            'S001': (1500, 1500),  # fully paid
            'S002': (1500,  600),  # partially paid — parent locked out
            'S003': (1200, 1200),  # fully paid
            'S004': (1200, 1200),  # fully paid
            'S005': (1500, 1500),  # fully paid
        }
        for student, _ in students:
            total, paid = fee_configs.get(student.student_id, (1500, 1500))
            Fee.objects.get_or_create(
                student=student,
                defaults={
                    'total':      total,
                    'paid':       paid,
                    'term':       'Term 1',
                    'updated_by': bursar,
                }
            )

        self.stdout.write(self.style.SUCCESS('  ✓ Fees configured'))

        # ── Summary ────────────────────────────────────────────────────────
        self.stdout.write(self.style.SUCCESS('\n✅  Demo data ready!\n'))
        self.stdout.write(self.style.WARNING('Login credentials:'))
        credentials = [
            ('Admin',    'headmaster',   'Admin123!'),
            ('Teacher',  'ms_johnson',   'Teacher123!'),
            ('Teacher',  'mr_osei',      'Teacher123!'),
            ('Bursar',   'bursar_kate',  'Bursar123!'),
            ('Parent',   'parent_alice', 'Parent123!'),  # S001 paid, S002 unpaid
            ('Parent',   'parent_bob',   'Parent123!'),  # S003 & S004 paid
        ]
        for role, username, password in credentials:
            self.stdout.write(f'  [{role:8s}]  username={username}  password={password}')
        self.stdout.write('')

    def _create_user(self, username, email, password, role, first_name='', last_name=''):
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email':      email,
                'role':       role,
                'first_name': first_name,
                'last_name':  last_name,
                'is_staff':   role == Role.ADMIN,
                'is_superuser': role == Role.ADMIN,
            }
        )
        if created:
            user.set_password(password)
            user.save()
        return user
