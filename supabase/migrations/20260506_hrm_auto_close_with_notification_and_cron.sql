-- When an employee forgets to clock out, don't invent a check_out time.
-- Mark that day's status as 'absent' and notify the employee — they can
-- apply regularization to record what actually happened, or apply leave
-- if they really were absent.
--
-- Scheduled by pg_cron at 23:59 IST nightly.

DROP FUNCTION IF EXISTS hrm_auto_close_open_attendance(date);

CREATE OR REPLACE FUNCTION hrm_auto_close_open_attendance(
    p_target_date date DEFAULT (now() AT TIME ZONE 'Asia/Kolkata')::date
)
RETURNS TABLE(employee_id uuid, attendance_date date, marked_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH closed AS (
        UPDATE hrm_attendance
           SET status      = 'absent',
               auto_closed = true,
               -- Keep check_in for audit; never invent a check_out.
               updated_at  = now()
         WHERE date = p_target_date
           AND check_in IS NOT NULL
           AND check_out IS NULL
        RETURNING hrm_attendance.employee_id, hrm_attendance.date, hrm_attendance.updated_at
    ),
    notified AS (
        INSERT INTO app_notifications (user_id, type, title, body, link, read, created_at)
        SELECT
            c.employee_id,
            'attendance_marked_absent',
            'Marked absent — please regularize',
            'You forgot to clock out on ' || to_char(c.date, 'DD Mon YYYY')
              || '. We''ve marked you as absent for that day. '
              || 'If you actually worked, please apply regularization with the correct times. '
              || 'If you were genuinely absent, you can apply leave instead.',
            '/(tabs)/hrms/regularizations',
            false,
            now()
        FROM closed c
        RETURNING user_id
    )
    SELECT c.employee_id, c.date, c.updated_at FROM closed c;
END;
$$;

DO $$
BEGIN
    PERFORM cron.unschedule('hrm_auto_close_attendance');
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
    'hrm_auto_close_attendance',
    '29 18 * * *',
    $$ SELECT hrm_auto_close_open_attendance(); $$
);

COMMENT ON FUNCTION hrm_auto_close_open_attendance IS
    'For any hrm_attendance row on the target date with check_in set '
    'but no check_out, marks status = ''absent'' and auto_closed = true. '
    'check_out stays NULL — we never invent a clock-out time. '
    'An app_notifications row is inserted prompting the employee to '
    'either regularize (if they actually worked) or apply leave. '
    'Scheduled by pg_cron daily at 23:59 IST.';
