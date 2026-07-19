-- Align the fixed Grade 10/11 demo catalogue with the approved 2026 monthly fee.
-- This targets the existing tutor and exact active catalogue only; no rows are created.
do $$
declare
  affected_rows integer;
begin
  update public.classes
  set monthly_fee = 1200.00,
      updated_at = now()
  where status = 'Active'
    and grade in ('Grade 10', 'Grade 11')
    and subject in ('Maths', 'Science', 'English', 'Tamil', 'History');

  get diagnostics affected_rows = row_count;
  if affected_rows <> 10 then
    raise exception 'Expected 10 active catalogue classes, updated %', affected_rows;
  end if;
end
$$;
