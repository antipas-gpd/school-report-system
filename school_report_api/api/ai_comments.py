"""
AI Comment Generator
Generates contextual comments based on student performance metrics.
Can be extended to call a real LLM API in future.
"""


def generate_ai_comment(average: float, attendance_pct: float) -> str:
    """
    Generate a performance comment based on average score and attendance.

    Args:
        average: Average score (0–100)
        attendance_pct: Attendance percentage (0–100)

    Returns:
        A human-readable comment string.
    """
    comment_parts = []

    # ── Academic performance ───────────────────────────────────────────────
    if average >= 80:
        comment_parts.append(
            f"Excellent academic performance with an average of {average:.1f}%. "
            "The student demonstrates outstanding understanding of all subjects "
            "and is encouraged to maintain this high standard."
        )
    elif average >= 65:
        comment_parts.append(
            f"Good academic performance with an average of {average:.1f}%. "
            "The student shows solid grasp of core concepts. "
            "Continued effort will lead to excellent results."
        )
    elif average >= 50:
        comment_parts.append(
            f"Satisfactory performance with an average of {average:.1f}%. "
            "The student is meeting basic requirements but has clear potential "
            "for improvement with more consistent study habits."
        )
    else:
        comment_parts.append(
            f"The student is currently struggling with an average of {average:.1f}%. "
            "Urgent attention and additional support are recommended. "
            "Please schedule a meeting with the class teacher to discuss an improvement plan."
        )

    # ── Attendance ─────────────────────────────────────────────────────────
    if attendance_pct >= 95:
        comment_parts.append("Attendance is excellent.")
    elif attendance_pct >= 80:
        comment_parts.append(
            f"Attendance is acceptable at {attendance_pct:.1f}% "
            "but there is room for improvement."
        )
    elif attendance_pct >= 60:
        comment_parts.append(
            f"Attendance is a concern at {attendance_pct:.1f}%. "
            "Regular attendance is critical to academic success."
        )
    else:
        comment_parts.append(
            f"Attendance is critically low at {attendance_pct:.1f}%. "
            "This significantly impacts learning and must be addressed immediately."
        )

    return " ".join(comment_parts)
