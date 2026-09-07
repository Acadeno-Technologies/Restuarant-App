"""T Clock — accounts app serializers"""

import re
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, CustomRole, title_case


import datetime
from django.utils import timezone
from django.utils.dateparse import parse_datetime, parse_date


def parse_flexible_date(value):
    if not value:
        return None
    if isinstance(value, datetime.datetime):
        return timezone.make_aware(value) if timezone.is_naive(value) else value
    if isinstance(value, datetime.date):
        dt = datetime.datetime.combine(value, datetime.time.min)
        return timezone.make_aware(dt) if timezone.is_naive(dt) else dt

    val_str = str(value).strip()
    if not val_str or val_str == '—':
        return None

    # Try Django's parse_datetime & parse_date
    parsed = parse_datetime(val_str)
    if parsed:
        return timezone.make_aware(parsed) if timezone.is_naive(parsed) else parsed

    p_date = parse_date(val_str)
    if p_date:
        dt = datetime.datetime.combine(p_date, datetime.time.min)
        return timezone.make_aware(dt) if timezone.is_naive(dt) else dt

    formats = [
        '%d %b %Y',      # 19 Aug 2026
        '%d %B %Y',      # 19 August 2026
        '%d %b, %Y',     # 19 Aug, 2026
        '%d %B, %Y',     # 19 August, 2026
        '%Y-%m-%d',      # 2026-08-19
        '%d/%m/%Y',      # 19/08/2026
        '%d-%m-%Y',      # 19-08-2026
        '%m/%d/%Y',      # 08/19/2026
        '%Y/%m/%d',      # 2026/08/19
        '%b %d, %Y',     # Aug 19, 2026
        '%B %d, %Y',     # August 19, 2026
        '%b %d %Y',      # Aug 19 2026
        '%B %d %Y',      # August 19 2026
    ]
    for fmt in formats:
        try:
            dt = datetime.datetime.strptime(val_str, fmt)
            return timezone.make_aware(dt) if timezone.is_naive(dt) else dt
        except ValueError:
            pass

    return None


def validate_clean_phone(value):
    if value:
        clean_phone = ''.join(filter(str.isdigit, str(value)))
        if len(clean_phone) > 10:
            raise serializers.ValidationError("Phone number cannot be more than 10 digits.")
        if len(clean_phone) > 0 and len(clean_phone) < 10:
            raise serializers.ValidationError("Phone number must be exactly 10 digits.")
        return clean_phone
    return value


def validate_clean_email(value):
    if value:
        val_str = str(value).strip().lower()
        if not val_str:
            return ""
        
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, val_str):
            raise serializers.ValidationError("Please enter a valid email address (e.g. name@gmail.com).")
        
        parts = val_str.split('@')
        if len(parts) != 2:
            raise serializers.ValidationError("Invalid email address format.")
            
        domain_part = parts[1]
        domain_subparts = domain_part.split('.')
        tld = domain_subparts[-1]

        # Check for common TLD typos
        invalid_tlds = {'ocm', 'cmo', 'con', 'comm', 'coom', 'vom', 'xom', 'cpm', 'ckm'}
        if tld in invalid_tlds:
            raise serializers.ValidationError(f'Invalid domain ending ".{tld}". Did you mean ".com"?')

        # Check for common domain typos
        domain_typos = {
            'gm.com': 'gmail.com',
            'gm.ocm': 'gmail.com',
            'gmai.com': 'gmail.com',
            'gamil.com': 'gmail.com',
            'gmaill.com': 'gmail.com',
            'gmal.com': 'gmail.com',
            'gmail.ocm': 'gmail.com',
            'gmail.con': 'gmail.com',
            'gmail.cmo': 'gmail.com',
            'yaho.com': 'yahoo.com',
            'yahoo.ocm': 'yahoo.com',
            'hotmial.com': 'hotmail.com',
            'outlok.com': 'outlook.com',
        }
        if domain_part in domain_typos:
            raise serializers.ValidationError(f'Invalid email domain "{domain_part}". Did you mean "{domain_typos[domain_part]}"?')

        return val_str
    return value


class CustomRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomRole
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    custom_role_data = CustomRoleSerializer(source='custom_role', read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    email = serializers.CharField(required=False, allow_blank=True)
    date_joined = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'custom_role', 'custom_role_data', 'date_joined', 'is_active', 'raw_password', 'password']
        read_only_fields = ['id']

    def to_internal_value(self, data):
        if hasattr(data, '_mutable'):
            data = data.copy()
        elif isinstance(data, dict):
            data = data.copy()

        if 'first_name' in data and data['first_name']:
            data['first_name'] = title_case(data['first_name'])
        if 'last_name' in data and data['last_name']:
            data['last_name'] = title_case(data['last_name'])

        return super().to_internal_value(data)

    def validate_phone(self, value):
        return validate_clean_phone(value)

    def validate_email(self, value):
        return validate_clean_email(value)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        date_joined_val = validated_data.pop('date_joined', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if date_joined_val:
            parsed_dt = parse_flexible_date(date_joined_val)
            if parsed_dt:
                instance.date_joined = parsed_dt
        if password and str(password).strip():
            pwd_clean = str(password).strip()
            instance.set_password(pwd_clean)
            instance.raw_password = pwd_clean
        instance.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=4)
    email = serializers.CharField(required=False, allow_blank=True)
    date_joined = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role', 'phone', 'custom_role', 'date_joined']

    def to_internal_value(self, data):
        if hasattr(data, '_mutable'):
            data = data.copy()
        elif isinstance(data, dict):
            data = data.copy()

        if 'first_name' in data and data['first_name']:
            data['first_name'] = title_case(data['first_name'])
        if 'last_name' in data and data['last_name']:
            data['last_name'] = title_case(data['last_name'])

        return super().to_internal_value(data)

    def validate_phone(self, value):
        return validate_clean_phone(value)

    def validate_email(self, value):
        return validate_clean_email(value)

    def create(self, validated_data):
        password = validated_data['password']
        date_joined_val = validated_data.pop('date_joined', None)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'staff'),
            phone=validated_data.get('phone', ''),
        )
        user.raw_password = password
        custom_role = validated_data.get('custom_role')
        if custom_role:
            user.custom_role = custom_role
            user.role = custom_role.base_access
        if date_joined_val:
            parsed_dt = parse_flexible_date(date_joined_val)
            if parsed_dt:
                user.date_joined = parsed_dt
        user.save()
        return user


class CustomTokenSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that includes user role and name in the token response."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'name': self.user.get_full_name() or self.user.username,
            'role': self.user.role,
            'email': self.user.email,
        }
        return data


class RestaurantSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = __import__('accounts.models', fromlist=['RestaurantSettings']).RestaurantSettings
        fields = [
            'name', 'tagline', 'address', 'phone', 'gstin', 'footer',
            'currency_symbol', 'invoice_prefix', 'tax_rate', 'service_charge',
            'packing_charge', 'footer_greeting'
        ]
