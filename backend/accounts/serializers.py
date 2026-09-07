"""T Clock — accounts app serializers"""

import re
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, CustomRole


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

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'custom_role', 'custom_role_data', 'date_joined', 'is_active', 'raw_password', 'password']
        read_only_fields = ['id', 'date_joined']

    def validate_phone(self, value):
        return validate_clean_phone(value)

    def validate_email(self, value):
        return validate_clean_email(value)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password and str(password).strip():
            pwd_clean = str(password).strip()
            instance.set_password(pwd_clean)
            instance.raw_password = pwd_clean
        instance.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=4)
    email = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role', 'phone', 'custom_role']

    def validate_phone(self, value):
        return validate_clean_phone(value)

    def validate_email(self, value):
        return validate_clean_email(value)

    def create(self, validated_data):
        password = validated_data['password']
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
