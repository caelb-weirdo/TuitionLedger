-- Grade-mismatch enrollment audit
-- This migration is audit-only and does not modify enrollment data.

-- Find active enrollments where the student's grade differs
-- from the class grade.
select
  cs.id as enrollment_id,
  s.student_code,
  s.full_name,
  s.grade as student_grade,
  c.class_name,
  c.grade as class_grade
from class_students cs
join students s on s.id = cs.student_id
join classes c on c.id = cs.class_id
where cs.status = 'Active'
  and s.grade <> c.grade
order by s.student_code, c.class_name;

-- Do not add a broad automatic UPDATE here.
--
-- After manually reviewing the results, create a separate migration
-- that updates only the confirmed enrollment_id values.
--
-- Safe cleanup example:
--
-- begin;
--
-- update class_students
-- set status = 'Removed'
-- where id in (
--   'confirmed-enrollment-uuid-1',
--   'confirmed-enrollment-uuid-2'
-- )
-- and status = 'Active'
-- returning id;
--
-- commit;