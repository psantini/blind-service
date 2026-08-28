-- generateAdventBlind creates a 'thoughts' attribute with input_type='textarea'.
-- Widen the check constraint to allow it.
alter table public.attributes
  drop constraint if exists attributes_input_type_check;

alter table public.attributes
  add constraint attributes_input_type_check
  check (input_type in ('text', 'dropdown', 'numeric', 'boolean', 'textarea'));
