DO $$
DECLARE
  new_agent_id uuid;
BEGIN
  -- 1. Insert Vamsi Krishna .C and capture the new ID
  INSERT INTO public.agents (name, role, email, phone, image, bio)
  VALUES (
    'Vamsi Krishna .C',
    'CRM & Compliance Manager',
    'vamsi.c@27estates.com',
    '9652141051',
    '/agents/vamsi-krishna.png',
    'Experienced CRM & Compliance Manager ensuring smooth operations and customer satisfaction.'
  )
  RETURNING id INTO new_agent_id;

  -- 2. Update all properties to point to the new agent
  UPDATE public.properties
  SET agent_id = new_agent_id;

  -- 3. Delete all other agents
  DELETE FROM public.agents
  WHERE id != new_agent_id;

END $$;
