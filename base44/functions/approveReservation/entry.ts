import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { reservation_id, action } = await req.json();

    if (!reservation_id || !action) {
      return Response.json({ error: 'reservation_id e action são obrigatórios' }, { status: 400 });
    }

    // Fetch reservation to verify ownership
    const reservation = await base44.entities.Reservation.get(reservation_id);

    if (!reservation) {
      return Response.json({ error: 'Reserva não encontrada' }, { status: 404 });
    }

    // Only the organizer or admin can approve/cancel
    const isOrganizer = reservation.organizer_id === user.id;
    const isAdmin = user.role === 'admin';
    if (!isOrganizer && !isAdmin) {
      return Response.json({ error: 'Apenas o organizador pode aprovar reservas' }, { status: 403 });
    }

    const now = new Date().toISOString();

    if (action === 'confirm') {
      // Generate a unique check-in code: SUBLINX-XXXXXXXX
      const codeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let randomPart = '';
      for (let i = 0; i < 8; i++) {
        randomPart += codeChars[Math.floor(Math.random() * codeChars.length)];
      }
      const checkInCode = `SBLX-${randomPart}`;

      await base44.asServiceRole.entities.Reservation.update(reservation_id, {
        status: 'confirmed',
        confirmed_at: now,
        check_in_code: checkInCode,
      });

      // Notify the user
      await base44.asServiceRole.entities.Notification.create({
        user_id: reservation.user_id,
        type: 'reservation_confirmed',
        title: 'Reserva Confirmada! ✅',
        message: `Sua reserva em ${reservation.venue_name} foi confirmada! Apresente o código ${checkInCode} no local para o check-in.`,
        reservation_id: reservation_id,
      });

      return Response.json({
        success: true,
        status: 'confirmed',
        check_in_code: checkInCode,
      });
    }

    if (action === 'cancel') {
      await base44.asServiceRole.entities.Reservation.update(reservation_id, {
        status: 'cancelled',
        cancelled_at: now,
        cancelled_by: 'organizer',
      });

      await base44.asServiceRole.entities.Notification.create({
        user_id: reservation.user_id,
        type: 'reservation_cancelled',
        title: 'Reserva Cancelada',
        message: `Infelizmente sua reserva em ${reservation.venue_name} foi cancelada pelo estabelecimento.`,
        reservation_id: reservation_id,
      });

      return Response.json({ success: true, status: 'cancelled' });
    }

    if (action === 'complete') {
      await base44.asServiceRole.entities.Reservation.update(reservation_id, {
        status: 'completed',
        checked_out_at: now,
      });

      return Response.json({ success: true, status: 'completed' });
    }

    return Response.json({ error: 'Ação inválida. Use: confirm, cancel, ou complete' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});