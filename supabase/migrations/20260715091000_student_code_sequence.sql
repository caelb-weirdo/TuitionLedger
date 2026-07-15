create table if not exists tutor_student_counters (
  tutor_id uuid primary key references tutors(id) on delete cascade,
  next_number integer not null default 1 check (next_number > 0)
);

insert into tutor_student_counters(tutor_id, next_number)
select t.id, coalesce(max(nullif(regexp_replace(s.student_code, '\\D', '', 'g'), '')::integer), 0) + 1
from tutors t left join students s on s.tutor_id = t.id
group by t.id
on conflict (tutor_id) do update set next_number = greatest(tutor_student_counters.next_number, excluded.next_number);

create or replace function next_student_code(p_tutor_id uuid)
returns text language sql as $$
  insert into tutor_student_counters(tutor_id, next_number)
  values (p_tutor_id, 2)
  on conflict (tutor_id) do update
    set next_number = tutor_student_counters.next_number + 1
  returning 'STU' || lpad((next_number - 1)::text, 3, '0');
$$;
