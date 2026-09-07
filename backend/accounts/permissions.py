"""T Clock — role-based permissions"""

from rest_framework.permissions import BasePermission, IsAuthenticated


class IsAdmin(BasePermission):
    """Only Admin/Owner users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')


class IsStaffOrAdmin(BasePermission):
    """Staff/Cashier or Admin users."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'staff']
        )


class IsKitchenOrAdmin(BasePermission):
    """Kitchen cooks or Admin users."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'kitchen']
        )


class IsAnyStaff(BasePermission):
    """Any authenticated restaurant staff (admin, staff, kitchen)."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'staff', 'kitchen']
        )
