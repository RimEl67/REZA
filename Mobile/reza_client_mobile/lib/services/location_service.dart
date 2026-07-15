import 'dart:async';

import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

class UserLocation {
  final double lat;
  final double lng;
  const UserLocation({required this.lat, required this.lng});
}

class LocationRequestResult {
  final UserLocation? location;
  final String? error;
  const LocationRequestResult({this.location, this.error});
  bool get ok => location != null;
}

/// Soft GPS for discovery. On fail → null location (show ALL salons, no km).
/// Never fakes Casablanca coords as filter center.
class LocationService {
  static const _prefsGranted = 'reza_geo_granted';
  static const _prefsDismissed = 'reza_geo_prompt_dismissed';

  String geoErrorMessage(Object? err) {
    if (err is LocationPermission) {
      return 'Localisation refusée. Tous les salons restent visibles.';
    }
    if (err is TimeoutException) {
      return 'Délai dépassé pour obtenir la position. Réessayez ou saisissez une ville. Tous les salons restent visibles.';
    }
    if (err is String) {
      switch (err) {
        case 'PERMISSION_DENIED':
          return 'Localisation refusée. Tous les salons restent visibles.';
        case 'POSITION_UNAVAILABLE':
          return 'Position indisponible (GPS, Wi‑Fi ou réseau). Vérifiez les services de localisation, puis réessayez. Tous les salons restent visibles.';
        case 'SERVICE_DISABLED':
          return 'Position indisponible (GPS, Wi‑Fi ou réseau). Vérifiez les services de localisation, puis réessayez. Tous les salons restent visibles.';
        case 'TIMEOUT':
          return 'Délai dépassé pour obtenir la position. Réessayez ou saisissez une ville. Tous les salons restent visibles.';
        default:
          break;
      }
    }
    return 'Impossible d\u2019obtenir votre position. Tous les salons restent visibles.';
  }

  Future<bool> wasPromptDismissed() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_prefsDismissed) == true;
  }

  Future<bool> wasGrantedBefore() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_prefsGranted) == true;
  }

  Future<void> markPromptDismissed() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefsDismissed, true);
  }

  Future<void> markGranted() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefsGranted, true);
    await prefs.remove(_prefsDismissed);
  }

  Future<void> clearGranted() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_prefsGranted);
  }

  /// Ask OS for GPS. On deny/fail → location null (all salons, no km).
  Future<LocationRequestResult> requestUserLocation() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        await clearGranted();
        return LocationRequestResult(error: geoErrorMessage('SERVICE_DISABLED'));
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        await clearGranted();
        return LocationRequestResult(error: geoErrorMessage('PERMISSION_DENIED'));
      }

      Position position;
      try {
        position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.medium,
            timeLimit: Duration(seconds: 15),
          ),
        );
      } on TimeoutException {
        // Retry with higher accuracy (mirrors web POSITION_UNAVAILABLE flip).
        try {
          position = await Geolocator.getCurrentPosition(
            locationSettings: const LocationSettings(
              accuracy: LocationAccuracy.high,
              timeLimit: Duration(seconds: 15),
            ),
          );
        } on TimeoutException {
          await clearGranted();
          return LocationRequestResult(error: geoErrorMessage('TIMEOUT'));
        }
      }

      await markGranted();
      return LocationRequestResult(
        location: UserLocation(lat: position.latitude, lng: position.longitude),
      );
    } on TimeoutException {
      await clearGranted();
      return LocationRequestResult(error: geoErrorMessage('TIMEOUT'));
    } catch (e) {
      await clearGranted();
      final msg = e.toString().toLowerCase();
      if (msg.contains('denied')) {
        return LocationRequestResult(error: geoErrorMessage('PERMISSION_DENIED'));
      }
      if (msg.contains('timeout')) {
        return LocationRequestResult(error: geoErrorMessage('TIMEOUT'));
      }
      if (msg.contains('unavailable') || msg.contains('disabled')) {
        return LocationRequestResult(error: geoErrorMessage('POSITION_UNAVAILABLE'));
      }
      return LocationRequestResult(error: geoErrorMessage(e));
    }
  }
}

final locationService = LocationService();
