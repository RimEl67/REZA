import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/family_member.dart';

const _key = 'reza_booking_for_proche';

class BookingForProche {
  final String id;
  final String name;
  final String? firstName;
  final String? lastName;
  final String? relationship;

  const BookingForProche({
    required this.id,
    required this.name,
    this.firstName,
    this.lastName,
    this.relationship,
  });

  factory BookingForProche.fromMember(FamilyMember m) => BookingForProche(
        id: m.id,
        name: m.name,
        firstName: m.firstName,
        lastName: m.lastName,
        relationship: m.relationship,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'firstName': firstName,
        'lastName': lastName,
        'relationship': relationship,
      };

  factory BookingForProche.fromJson(Map<String, dynamic> json) => BookingForProche(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        firstName: json['firstName']?.toString(),
        lastName: json['lastName']?.toString(),
        relationship: json['relationship']?.toString(),
      );
}

Future<void> setBookingForProche(BookingForProche proche) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString(_key, jsonEncode(proche.toJson()));
}

Future<BookingForProche?> peekBookingForProche() async {
  final prefs = await SharedPreferences.getInstance();
  final raw = prefs.getString(_key);
  if (raw == null || raw.isEmpty) return null;
  try {
    return BookingForProche.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  } catch (_) {
    return null;
  }
}

Future<void> clearBookingForProche() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.remove(_key);
}
