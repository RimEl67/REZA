import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants.dart';
import '../widgets/reza_bottom_nav.dart';
import 'search_results_screen.dart';
import 'venue_detail_screen.dart';
import 'bookings_screen.dart';
import 'profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _navIndex = 0;
  String _searchCategory = 'Prestations (coupe, barbier...)';
  String _searchCity = 'Adresse, ville...';

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
                setState(() => _searchCategory = categories[index]);
                Navigator.pop(context);
              },
            );
          },
        );
      },
    );
  }

  void _showCityPicker() {
    final cities = ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Agadir'];
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
                setState(() => _searchCity = cities[index]);
                Navigator.pop(context);
              },
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      _buildHomeBody(),
      const SearchResultsScreen(),
      const BookingsScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: IndexedStack(index: _navIndex, children: pages),
      bottomNavigationBar: RezaBottomNav(
        currentIndex: _navIndex,
        onTap: (i) => setState(() => _navIndex = i),
      ),
    );
  }

  Widget _buildHomeBody() {
    return CustomScrollView(
      slivers: [
        // ── Top Header (Logo + Icons) ──────────────────────────────
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

        // ── Hero Section & Search Card ─────────────────────────────
        SliverToBoxAdapter(
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              // Hero Background
              Container(
                height: 280,
                width: double.infinity,
                decoration: const BoxDecoration(
                  image: DecorationImage(
                    image: NetworkImage('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop'),
                    fit: BoxFit.cover,
                  ),
                ),
                child: Container(
                  color: Colors.black.withValues(alpha: 0.3), // Dark overlay
                ),
              ),
              // Search Card
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
                      // Prestations input
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
                                style: GoogleFonts.inter(color: _searchCategory.startsWith('Prestations') ? AppColors.textGray : AppColors.textDark, fontSize: 14, fontWeight: _searchCategory.startsWith('Prestations') ? FontWeight.w400 : FontWeight.w600)
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      // Adresse input
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
                                _searchCity, 
                                style: GoogleFonts.inter(color: _searchCity.startsWith('Adresse') ? AppColors.textGray : AppColors.textDark, fontSize: 14, fontWeight: _searchCity.startsWith('Adresse') ? FontWeight.w400 : FontWeight.w600)
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Rechercher Button
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton.icon(
                          onPressed: () => setState(() => _navIndex = 1),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary, // Primary color button
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
              const SizedBox(height: 60), // Space for the floating card
              // ── Categories ──────────────────────────────────────
              const SizedBox(height: 8),
              // ── Categories ──────────────────────────────────────
              const SizedBox(height: 16),
              SizedBox(
                height: 115,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: serviceCategories.length,
                  itemBuilder: (context, index) {
                    final cat = serviceCategories[index];
                    return GestureDetector(
                      onTap: () => setState(() => _navIndex = 1),
                      child: Container(
                        margin: const EdgeInsets.only(right: 16),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF5F5F7),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Icon(
                                cat['icon'] as IconData,
                                size: 26,
                                color: const Color(0xFF1D1D1F),
                              ),
                            ),
                            const SizedBox(height: 6),
                            SizedBox(
                              width: 64,
                              child: Text(
                                cat['label'] as String,
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

              // ── Recommandés ─────────────────────────────────────────
              const SizedBox(height: 28),
              _buildSectionHeader('Recommandés', 'Voir tout'),
              const SizedBox(height: 14),
              SizedBox(
                height: 250,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: 3,
                  itemBuilder: (context, index) {
                    final venue = allVenues[index];
                    return _buildRecommandeCard(venue);
                  },
                ),
              ),

              // ── Récemment consulté ──────────────────────────────────
              const SizedBox(height: 28),
              _buildSectionHeader('Récemment consulté', 'Voir tout'),
              const SizedBox(height: 14),
              SizedBox(
                height: 270,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: 2,
                  itemBuilder: (context, index) {
                    final venue = allVenues[index + 3];
                    return _buildRecemmentConsulteCard(venue);
                  },
                ),
              ),

              // ── Nouveaux sur Reza ───────────────────────────────────
              const SizedBox(height: 28),
              _buildSectionHeader('Nouveaux sur Reza', 'Voir tout'),
              const SizedBox(height: 14),
              SizedBox(
                height: 230,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: 2,
                  itemBuilder: (context, index) {
                    final venue = allVenues[index == 0 ? 5 : 1];
                    return _buildNouveauCard(venue);
                  },
                ),
              ),

              // ── Professionnels à proximité ──────────────────────────
              const SizedBox(height: 28),
              _buildSectionHeader('Professionnels à proximité', 'Tout voir'),
              const SizedBox(height: 14),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: allProfessionals.length,
                itemBuilder: (context, index) {
                  final prof = allProfessionals[index];
                  return _buildProfessionalCard(prof);
                },
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String title, String action) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.textDark,
            ),
          ),
          GestureDetector(
            onTap: () => setState(() => _navIndex = 1),
            child: Text(
              action,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textGray,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecommandeCard(VenueItem venue) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => VenueDetailScreen(venue: venue)),
        );
      },
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
                    child: Text(
                      'À la une',
                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textDark),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    venue.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textDark),
                  ),
                ),
                Row(
                  children: [
                    const Icon(Icons.star_rounded, size: 14, color: AppColors.starColor),
                    const SizedBox(width: 2),
                    Text(
                      venue.rating.toString().replaceAll('.', ','),
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textDark),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '> 50 km · ${venue.location}',
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
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => VenueDetailScreen(venue: venue)),
        );
      },
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
                    child: Text(
                      'À la une',
                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textDark),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    venue.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textDark),
                  ),
                ),
                Row(
                  children: [
                    const Icon(Icons.star_rounded, size: 14, color: AppColors.starColor),
                    const SizedBox(width: 2),
                    Text(
                      venue.rating.toString().replaceAll('.', ','),
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textDark),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              '${venue.category} · ${venue.reviews} avis',
              style: GoogleFonts.inter(fontSize: 12, color: AppColors.textGray),
            ),
            const SizedBox(height: 2),
            Text(
              '> 50 km · ${venue.location}',
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
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => VenueDetailScreen(venue: venue)),
        );
      },
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
                  child: Text(
                    venue.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textDark),
                  ),
                ),
                Row(
                  children: [
                    const Icon(Icons.star_rounded, size: 14, color: AppColors.starColor),
                    const SizedBox(width: 2),
                    Text(
                      venue.rating.toString().replaceAll('.', ','),
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textDark),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '${venue.distance} · ${venue.location}',
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
          CircleAvatar(
            radius: 30,
            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            backgroundImage: prof.avatarUrl.startsWith('http') ? NetworkImage(prof.avatarUrl) : null,
            child: prof.avatarUrl.startsWith('http')
                ? null
                : Text(
                    prof.avatarUrl,
                    style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  prof.name,
                  style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textDark),
                ),
                const SizedBox(height: 4),
                Text(
                  '${prof.distance} · ${prof.role}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(fontSize: 12, color: AppColors.textGray),
                ),
                const SizedBox(height: 4),
                Text(
                  prof.role.contains('Massage') ? 'Massage Therapist' : 'Beauty Expert',
                  style: GoogleFonts.inter(fontSize: 11, color: AppColors.textLight, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
