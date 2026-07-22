import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants.dart';
import 'package:provider/provider.dart';
import '../models/venue_mapper.dart';
import '../viewmodels/home_viewmodel.dart';
import '../widgets/geo_prompt_banner.dart';
import '../widgets/reza_bottom_nav.dart';
import 'search_results_screen.dart';
import 'venue_detail_screen.dart';
import 'bookings_screen.dart';
import 'proches_screen.dart';
import 'profile_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) {
        final vm = HomeViewModel();
        vm.loadTenants();
        vm.initGeoPrompt();
        return vm;
      },
      child: const _HomeScreenBody(),
    );
  }
}

class _HomeScreenBody extends StatefulWidget {
  const _HomeScreenBody();

  @override
  State<_HomeScreenBody> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<_HomeScreenBody> {
  int _navIndex = 0;

  HomeViewModel get _vm => context.watch<HomeViewModel>();

  Future<void> _loadTenants({String? category}) =>
      context.read<HomeViewModel>().loadTenants(category: category);

  List<VenueItem> get _filteredVenues => _vm.filteredVenues;

  String get _searchCityLabel => _vm.searchCityLabel;

  String? get _selectedCategory => _vm.selectedCategory;
  set _selectedCategory(String? v) => _vm.setCategory(v);

  set _searchCategory(String v) => _vm.setSearchCategory(v);
  String get _searchCategory => _vm.searchCategory;

  bool get _loading => _vm.loading;
  String? get _error => _vm.error;

  void _openVenue(VenueItem venue) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => VenueDetailScreen(
          tenantId: venue.id,
          onGoToBookings: () => setState(() => _navIndex = 2),
        ),
      ),
    );
  }

  void _showCategoryPicker() {
    final categories = ['Tous', ...serviceCategories.map((c) => c['label'] as String)];
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        return ListView.builder(
          shrinkWrap: true,
          padding: const EdgeInsets.symmetric(vertical: 20),
          itemCount: categories.length,
          itemBuilder: (context, index) {
            return ListTile(
              title: Text(categories[index], style: GoogleFonts.inter(fontSize: 16)),
              onTap: () {
                final label = categories[index];
                final vm = context.read<HomeViewModel>();
                vm.searchCategory = label;
                vm.setCategory(label == 'Tous' ? null : label);
                Navigator.pop(context);
                vm.loadTenants(category: vm.selectedCategory);
              },
            );
          },
        );
      },
    );
  }

  void _showCityPicker() {
    final cities = ['Toutes les villes', 'Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Agadir'];
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        return ListView.builder(
          shrinkWrap: true,
          padding: const EdgeInsets.symmetric(vertical: 20),
          itemCount: cities.length,
          itemBuilder: (context, index) {
            return ListTile(
              leading: const Icon(Icons.location_on_outlined, color: AppColors.textGray),
              title: Text(cities[index], style: GoogleFonts.inter(fontSize: 16)),
              onTap: () {
                final vm = context.read<HomeViewModel>();
                final label = cities[index];
                vm.setSearchCity(label == 'Toutes les villes' ? '' : label);
                Navigator.pop(context);
                vm.loadTenants(category: vm.selectedCategory);
              },
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: IndexedStack(
        index: _navIndex,
        children: [
          _buildHomeBody(),
          SearchResultsScreen(onGoToBookings: () => setState(() => _navIndex = 2)),
          BookingsScreen(),
          ProchesScreen(onExplore: () => setState(() => _navIndex = 1)),
          const ProfileScreen(),
        ],
      ),
      bottomNavigationBar: RezaBottomNav(
        currentIndex: _navIndex,
        onTap: (i) => setState(() => _navIndex = i),
      ),
    );
  }

  Widget _buildHomeBody() {
    final list = _filteredVenues;
    final recommended = list.take(3).toList();
    final recent = list.length > 3 ? list.skip(3).take(2).toList() : list.take(2).toList();
    final nouveaux = list.length > 1
        ? [list.last, list[list.length > 1 ? 1 : 0]]
        : list;

    return RefreshIndicator(
      onRefresh: () async {
        final vm = context.read<HomeViewModel>();
        if (vm.hasUserLocation) {
          await vm.requestUserLocation();
        } else {
          await vm.loadTenants();
        }
      },
      color: AppColors.primary,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
        SliverToBoxAdapter(
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Center(
                child: Text(
                  'REZA',
                  style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: 4),
                ),
              ),
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              SizedBox(
                height: 280,
                width: double.infinity,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.network(
                      'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop',
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        color: Colors.grey[800],
                        child: const Icon(Icons.image_not_supported, color: Colors.white30, size: 50),
                      ),
                    ),
                    Container(color: Colors.black.withValues(alpha: 0.3)),
                  ],
                ),
              ),
              Positioned(
                bottom: -40,
                left: 20,
                right: 20,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 20, offset: const Offset(0, 10)),
                    ],
                  ),
                  child: Column(
                    children: [
                      GestureDetector(
                        onTap: _showCategoryPicker,
                        child: Container(
                          height: 50,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.search_rounded, color: AppColors.textGray, size: 20),
                              const SizedBox(width: 12),
                              Text(
                                _searchCategory,
                                style: GoogleFonts.inter(
                                  color: _searchCategory.startsWith('Prestations') ? AppColors.textGray : AppColors.textDark,
                                  fontSize: 14,
                                  fontWeight: _searchCategory.startsWith('Prestations') ? FontWeight.w400 : FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      GestureDetector(
                        onTap: _showCityPicker,
                        child: Container(
                          height: 50,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.location_on_outlined, color: AppColors.textGray, size: 20),
                              const SizedBox(width: 12),
                              Text(
                                _searchCityLabel,
                                style: GoogleFonts.inter(color: AppColors.textDark, fontSize: 14, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton.icon(
                          onPressed: () => setState(() => _navIndex = 1),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          icon: const Icon(Icons.search_rounded, size: 20),
                          label: Text('Rechercher', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        SliverToBoxAdapter(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 60),
              const SizedBox(height: 16),
              if (_loading)
                const Padding(
                  padding: EdgeInsets.all(24),
                  child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                ),
              if (_error != null && !_loading)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Text(
                    'Impossible de charger les salons. Vérifiez la connexion API.',
                    style: GoogleFonts.inter(fontSize: 12, color: AppColors.textLight),
                  ),
                ),
              if (!_loading && _error == null && list.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Text(
                    'Aucun salon trouvé. Essayez une autre ville ou élargissez la recherche.',
                    style: GoogleFonts.inter(fontSize: 13, color: AppColors.textGray),
                  ),
                ),
              if ((_vm.showGeoPrompt == true || _vm.geoError != null) && !_vm.hasUserLocation)
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                  child: GeoPromptBanner(
                    loading: _vm.geoLoading,
                    error: _vm.geoError,
                    onUseLocation: () => context.read<HomeViewModel>().requestUserLocation(),
                    onDismiss: () => context.read<HomeViewModel>().dismissGeoPrompt(),
                  ),
                ),
              SizedBox(
                height: 115,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: serviceCategories.length,
                  itemBuilder: (context, index) {
                    final cat = serviceCategories[index];
                    final label = cat['label'] as String;
                    final selected = _selectedCategory == label;
                    return GestureDetector(
                      onTap: () {
                        final next = selected ? null : label;
                        setState(() {
                          _selectedCategory = next;
                          _searchCategory = next ?? 'Prestations (coupe, barbier...)';
                        });
                        _loadTenants(category: next);
                      },
                      child: Container(
                        margin: const EdgeInsets.only(right: 16),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                color: selected ? AppColors.textDark : const Color(0xFFF5F5F7),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Icon(
                                cat['icon'] as IconData,
                                size: 26,
                                color: selected ? Colors.white : const Color(0xFF1D1D1F),
                              ),
                            ),
                            const SizedBox(height: 6),
                            SizedBox(
                              width: 64,
                              child: Text(
                                label,
                                textAlign: TextAlign.center,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  color: const Color(0xFF1D1D1F),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 28),
              _buildSectionHeader('Recommandés', 'Voir tout'),
              const SizedBox(height: 14),
              SizedBox(
                height: 250,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: recommended.length,
                  itemBuilder: (context, index) => _buildRecommandeCard(recommended[index]),
                ),
              ),
              const SizedBox(height: 28),
              _buildSectionHeader('Récemment consulté', 'Voir tout'),
              const SizedBox(height: 14),
              SizedBox(
                height: 270,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: recent.length,
                  itemBuilder: (context, index) => _buildRecemmentConsulteCard(recent[index]),
                ),
              ),
              const SizedBox(height: 28),
              _buildSectionHeader('Nouveaux sur Reza', 'Voir tout'),
              const SizedBox(height: 14),
              SizedBox(
                height: 230,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: nouveaux.length.clamp(0, 2),
                  itemBuilder: (context, index) => _buildNouveauCard(nouveaux[index]),
                ),
              ),
              const SizedBox(height: 28),
              _buildSectionHeader('Professionnels à proximité', 'Tout voir'),
              const SizedBox(height: 14),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: list.take(4).length,
                itemBuilder: (context, index) {
                  final v = list[index];
                  return GestureDetector(
                    onTap: () => _openVenue(v),
                    child: _buildProfessionalCard(
                      ProfessionalItem(
                        name: v.name,
                        distance: v.distance,
                        role: v.category,
                        avatarUrl: v.image,
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ],
    ),
  );
}

  Widget _buildSectionHeader(String title, String action) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textDark)),
          GestureDetector(
            onTap: () => setState(() => _navIndex = 1),
            child: Text(action, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textGray)),
          ),
        ],
      ),
    );
  }

  Widget _buildRecommandeCard(VenueItem venue) {
    return GestureDetector(
      onTap: () => _openVenue(venue),
      child: Container(
        width: 260,
        margin: const EdgeInsets.only(right: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.network(
                    venue.image,
                    height: 150,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      height: 150,
                      color: AppColors.surface,
                      child: const Icon(Icons.image_rounded, color: AppColors.textLight, size: 40),
                    ),
                  ),
                ),
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.9),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text('À la une', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textDark)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(venue.name, maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textDark)),
                ),
                Row(
                  children: [
                    const Icon(Icons.star_rounded, size: 14, color: AppColors.starColor),
                    const SizedBox(width: 2),
                    Text(venue.rating.toStringAsFixed(1).replaceAll('.', ','),
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textDark)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              venueMetaLine(venue),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.inter(fontSize: 12, color: AppColors.textGray),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecemmentConsulteCard(VenueItem venue) {
    return GestureDetector(
      onTap: () => _openVenue(venue),
      child: Container(
        width: 260,
        margin: const EdgeInsets.only(right: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.network(
                    venue.image,
                    height: 150,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      height: 150,
                      color: AppColors.surface,
                      child: const Icon(Icons.image_rounded, color: AppColors.textLight, size: 40),
                    ),
                  ),
                ),
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.9),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text('À la une', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textDark)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(venue.name, maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textDark)),
                ),
                Row(
                  children: [
                    const Icon(Icons.star_rounded, size: 14, color: AppColors.starColor),
                    const SizedBox(width: 2),
                    Text(venue.rating.toStringAsFixed(1).replaceAll('.', ','),
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textDark)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 2),
            Text('${venue.category} · ${venue.reviews} avis', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textGray)),
            const SizedBox(height: 2),
            Text(
              venueMetaLine(venue),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.inter(fontSize: 12, color: AppColors.textGray),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNouveauCard(VenueItem venue) {
    return GestureDetector(
      onTap: () => _openVenue(venue),
      child: Container(
        width: 240,
        margin: const EdgeInsets.only(right: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.network(
                venue.image,
                height: 140,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  height: 140,
                  color: AppColors.surface,
                  child: const Icon(Icons.image_rounded, color: AppColors.textLight, size: 40),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(venue.name, maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textDark)),
                ),
                Row(
                  children: [
                    const Icon(Icons.star_rounded, size: 14, color: AppColors.starColor),
                    const SizedBox(width: 2),
                    Text(venue.rating.toStringAsFixed(1).replaceAll('.', ','),
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textDark)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              venueMetaLine(venue),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.inter(fontSize: 12, color: AppColors.textGray),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfessionalCard(ProfessionalItem prof) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: ClipOval(
              child: prof.avatarUrl.startsWith('http')
                  ? Image.network(
                      prof.avatarUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        final fallbackText = prof.name.trim().isNotEmpty ? prof.name.trim()[0].toUpperCase() : '?';
                        return Center(
                          child: Text(
                            fallbackText,
                            style: GoogleFonts.inter(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                        );
                      },
                    )
                  : Center(
                      child: Text(
                        prof.avatarUrl,
                        style: GoogleFonts.inter(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(prof.name, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textDark)),
                const SizedBox(height: 4),
                Text(
                  prof.distance.isNotEmpty ? '${prof.distance} · ${prof.role}' : prof.role,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(fontSize: 12, color: AppColors.textGray),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
