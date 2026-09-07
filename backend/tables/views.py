"""T Clock — Tables views"""

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from .models import DiningTable, TableOption
from .serializers import TableSerializer
from accounts.permissions import IsAdmin, IsStaffOrAdmin, IsAnyStaff


class TableListCreateView(generics.ListCreateAPIView):
    serializer_class = TableSerializer

    def get_queryset(self):
        qs = DiningTable.objects.filter(is_active=True).prefetch_related(
            'orders',
            'reservations'
        )
        section = self.request.query_params.get('section')
        status_filter = self.request.query_params.get('status')
        if section:
            qs = qs.filter(section=section)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [AllowAny()]



class TableDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = DiningTable.objects.all()
    serializer_class = TableSerializer

    def get_permissions(self):
        if self.request.method in ['DELETE', 'PUT']:
            return [IsAdmin()]
        return [IsStaffOrAdmin()]


class TableByQRView(APIView):
    """GET /api/tables/qr/<token>/ — Customer QR lookup (public)."""
    permission_classes = [AllowAny]

    def get(self, request, qr_token):
        try:
            table = DiningTable.objects.get(qr_token=qr_token, is_active=True)
            serializer = TableSerializer(table)
            return Response(serializer.data)
        except DiningTable.DoesNotExist:
            return Response({'error': 'Table not found'}, status=status.HTTP_404_NOT_FOUND)


class TableStatusUpdateView(APIView):
    """PATCH / PUT / POST /api/tables/<id>/status/ — update table status."""
    permission_classes = [IsStaffOrAdmin]

    def _update_status(self, request, pk):
        try:
            table = DiningTable.objects.get(pk=pk)
            raw_status = str(request.data.get('status', '')).strip().lower()
            
            # Map friendly aliases
            if raw_status in ['no_service', 'inactive', 'no service', 'disabled', 'deactivated']:
                table.status = 'no_service'
            elif raw_status in ['available', 'active', 'free']:
                table.status = 'available'
            elif raw_status in dict(DiningTable.STATUS_CHOICES):
                table.status = raw_status
            else:
                return Response({'error': f'Invalid status: {raw_status}'}, status=400)

            if 'is_active' in request.data:
                table.is_active = bool(request.data.get('is_active'))

            table.save()
            return Response(TableSerializer(table).data)
        except DiningTable.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

    def patch(self, request, pk):
        return self._update_status(request, pk)

    def put(self, request, pk):
        return self._update_status(request, pk)

    def post(self, request, pk):
        return self._update_status(request, pk)


class ReservationCreateView(APIView):
    """POST /api/tables/reservations/ — create a table reservation."""
    permission_classes = [IsStaffOrAdmin]

    def post(self, request):
        table_id = request.data.get('table_id')
        guest_name = request.data.get('guest_name')
        arrival_time = request.data.get('arrival_time')

        if not table_id:
            return Response({'error': 'table_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not guest_name or not str(guest_name).strip():
            return Response({'error': 'Guest name is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not arrival_time or not str(arrival_time).strip():
            return Response({'error': 'Arrival time is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            table = DiningTable.objects.get(pk=table_id, is_active=True)
        except DiningTable.DoesNotExist:
            return Response({'error': 'Table not found'}, status=status.HTTP_404_NOT_FOUND)

        # Create reservation
        from .models import Reservation
        from .serializers import ReservationSerializer
        reservation = Reservation.objects.create(
            table=table,
            guest_name=guest_name.strip(),
            arrival_time=arrival_time.strip(),
            status='awaiting_guest'
        )

        # Update table status to reserved
        table.status = 'reserved'
        table.save()

        return Response({
            'message': 'Reservation confirmed',
            'reservation': ReservationSerializer(reservation).data,
            'table': TableSerializer(table).data,
        }, status=status.HTTP_201_CREATED)


class ReservationCancelView(APIView):
    """POST /api/tables/reservations/<id>/cancel/ — cancel a reservation and set table status back to available."""
    permission_classes = [IsStaffOrAdmin]

    def post(self, request, pk):
        from .models import Reservation
        try:
            reservation = Reservation.objects.get(pk=pk)
            reservation.status = 'cancelled'
            reservation.save()

            table = reservation.table
            table.status = 'available'
            table.save()

            return Response({
                'message': 'Reservation cancelled',
                'table': TableSerializer(table).data,
            })
        except Reservation.DoesNotExist:
            return Response({'error': 'Reservation not found'}, status=404)


class TableOptionsView(APIView):
    """
    GET  /api/tables/options/ — Get all unique available capacities and dining sections
    POST /api/tables/options/ — Add a new custom capacity or dining section
    """
    permission_classes = [IsStaffOrAdmin]

    def get_options_data(self):
        # 1. Capacities ONLY from backend TableOption and existing DB Tables
        db_table_caps = [str(c) for c in DiningTable.objects.values_list('capacity', flat=True).distinct() if c]
        custom_caps = list(TableOption.objects.filter(option_type='capacity').values_list('value', flat=True))
        
        all_caps_set = set(db_table_caps + custom_caps)
        sorted_caps = sorted(all_caps_set, key=lambda x: int(x) if str(x).isdigit() else 999)

        # 2. Sections / Dining Areas ONLY from backend TableOption and existing DB Tables
        db_sections = [s.strip().title() for s in DiningTable.objects.values_list('section', flat=True).distinct() if s]
        custom_sections = [s.strip().title() for s in TableOption.objects.filter(option_type='section').values_list('value', flat=True) if s]

        seen_sections = set()
        final_sections = []
        for sec in custom_sections + db_sections:
            if sec and sec.lower() not in seen_sections:
                seen_sections.add(sec.lower())
                final_sections.append(sec)

        return {
            'capacities': sorted_caps,
            'sections': final_sections
        }

    def get(self, request):
        return Response(self.get_options_data())

    def post(self, request):
        option_type = request.data.get('option_type') # 'capacity' or 'section'
        value = str(request.data.get('value', '')).strip()

        if not option_type or option_type not in ['capacity', 'section']:
            return Response({'error': 'option_type must be either "capacity" or "section"'}, status=status.HTTP_400_BAD_REQUEST)

        if not value:
            return Response({'error': 'value cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)

        # Format value
        if option_type == 'capacity':
            cleaned_digits = ''.join(filter(str.isdigit, value))
            if not cleaned_digits:
                return Response({'error': 'Capacity must be a valid number'}, status=status.HTTP_400_BAD_REQUEST)
            value = cleaned_digits
        else:
            value = value.title()

        TableOption.objects.get_or_create(option_type=option_type, value=value)
        return Response({
            'message': 'Option saved successfully',
            'added': value,
            'options': self.get_options_data()
        }, status=status.HTTP_201_CREATED)

    def delete(self, request):
        TableOption.objects.all().delete()
        return Response({
            'message': 'All custom options removed successfully',
            'options': self.get_options_data()
        })

