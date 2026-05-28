-- Admin : suppression atomique de toute la cartographie d'un utilisateur.
-- Les sections sont supprimées en cascade (FK ON DELETE CASCADE).

CREATE OR REPLACE FUNCTION public.delete_cartography_for_user(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID;
  _deleted INT;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL OR NOT public.has_role(_uid, 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'admin_required');
  END IF;

  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user_id_required');
  END IF;

  DELETE FROM public.cartography_bundles
  WHERE user_id = p_user_id;

  GET DIAGNOSTICS _deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok', true,
    'deleted', _deleted
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_cartography_for_user(UUID) TO authenticated;

COMMENT ON FUNCTION public.delete_cartography_for_user(UUID) IS
  'Admin only — supprime tous les bundles cartographie (et sections en cascade) pour un utilisateur.';

NOTIFY pgrst, 'reload schema';
