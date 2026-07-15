import 'package:flutter/foundation.dart';
import '../constants.dart';
import '../models/venue_mapper.dart';
import '../services/discovery_service.dart';
import '../services/location_service.dart';

class HomeViewModel extends ChangeNotifier {
  String searchCategory = 'Prestations (coupe, barbier...)';
  /// Empty = no city filter (show all complete salons).
  String searchCity = '';
  String? selectedCategory;
  List<VenueItem> venues = [];
  bool loading = true;
  String? error;

  double? userLat;
  double? userLng;
  bool geoLoading = false;
  String? geoError;
  /// null = undecided, true = show banner, false = dismissed this session
  bool? showGeoPrompt;

  bool get hasUserLocation => userLat != null && userLng != null;

  String get searchCityLabel =>
      searchCity.isEmpty ? 'Toutes les villes' : searchCity;

  Future<void> initGeoPrompt() async {
    if (await locationService.wasPromptDismissed()) {
      showGeoPrompt = false;
      notifyListeners();
      return;
    }
    if (await locationService.wasGrantedBefore()) {
      await requestUserLocation();
      return;
    }
    showGeoPrompt = true;
    notifyListeners();
  }

  Future<void> loadTenants({String? category}) async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      final cat = category ?? selectedCategory;
      final city = searchCity.isNotEmpty ? searchCity : null;
      // Radius filter first when GPS on (nearby). Emulator GPS (e.g. Mountain
      // View) often yields 0 Casablanca salons — fall back to all, still sorted
      // by distance. Never use mock allVenues (fake ids 1/2 → detail 404).
      var tenants = await discoveryService.searchTenants(
        city: city,
        category: cat,
        lat: userLat,
        lng: userLng,
        radiusKm: hasUserLocation ? 10 : null,
        limit: 50,
      );
      if (tenants.isEmpty && hasUserLocation) {
        tenants = await discoveryService.searchTenants(
          city: city,
          category: cat,
          lat: userLat,
          lng: userLng,
          limit: 50,
        );
      }
      venues = tenants.map(tenantToVenueItem).toList();
      loading = false;
      notifyListeners();
    } catch (e) {
      venues = [];
      loading = false;
      error = e.toString();
      notifyListeners();
    }
  }

  /// Soft GPS ask. On fail → null location, all salons, no km.
  Future<bool> requestUserLocation() async {
    geoLoading = true;
    geoError = null;
    showGeoPrompt = true;
    notifyListeners();

    final result = await locationService.requestUserLocation();
    if (result.ok && result.location != null) {
      userLat = result.location!.lat;
      userLng = result.location!.lng;
      geoError = null;
      showGeoPrompt = false;
      geoLoading = false;
      notifyListeners();
      await loadTenants();
      return true;
    }

    userLat = null;
    userLng = null;
    geoError = result.error;
    showGeoPrompt = true;
    geoLoading = false;
    notifyListeners();
    await loadTenants();
    return false;
  }

  Future<void> dismissGeoPrompt() async {
    showGeoPrompt = false;
    geoError = null;
    await locationService.markPromptDismissed();
    notifyListeners();
  }

  void setSearchCity(String v) {
    searchCity = v;
    notifyListeners();
  }

  void setSearchCategory(String v) {
    searchCategory = v;
    notifyListeners();
  }

  void setCategory(String? cat) {
    selectedCategory = cat;
    notifyListeners();
  }

  List<VenueItem> get filteredVenues {
    if (selectedCategory == null || selectedCategory!.isEmpty) return venues;
    final cat = selectedCategory!.toLowerCase();
    return venues
        .where((v) =>
            v.category.toLowerCase().contains(cat) ||
            cat.contains(v.category.toLowerCase()))
        .toList();
  }
}
