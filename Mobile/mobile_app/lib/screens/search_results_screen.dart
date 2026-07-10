import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' hide Path;
import '../constants.dart';
import 'venue_detail_screen.dart';

class SearchResultsScreen extends StatefulWidget {
  const SearchResultsScreen({super.key});

  @override
  State<SearchResultsScreen> createState() => _SearchResultsScreenState();
}

class _SearchResultsScreenState extends State<SearchResultsScreen> {
  final Set<int> _likedVenues = {};
  final List<String> _recentSearches = ['Coupes et coiffures'];

  void _showSearchModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => _SearchModal(
        recentSearches: _recentSearches,
        onClearRecent: () => setState(() => _recentSearches.clear()),
      ),
    );
  }

  List<VenueItem> get _filtered => allVenues;

  void _toggleLike(int id) {
    setState(() {
      if (_likedVenues.contains(id)) {
        _likedVenues.remove(id);
      } else {
        _likedVenues.add(id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final results = _filtered;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: Stack(
        children: [
          // ── 1. Map Layer (Background) ──────────────────────────────
          Positioned.fill(
            child: FlutterMap(
              options: MapOptions(
                initialCenter: const LatLng(33.589, -7.603), // Casablanca
                initialZoom: 13.0,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.example.mobile_app',
                ),
                MarkerLayer(
                  markers: results.map((venue) {
                    return Marker(
                      point: LatLng(venue.latitude, venue.longitude),
                      width: 60,
                      height: 50,
                      alignment: Alignment.topCenter,
                      child: GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => VenueDetailScreen(venue: venue)),
                          );
                        },
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppColors.textDark, // Black speech bubble
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [
                                  BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 4, offset: const Offset(0, 2)),
                                ],
                              ),
                              child: Text(
                                venue.rating.toString().replaceAll('.', ','), // e.g. 5,0
                                style: GoogleFonts.inter(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700),
                              ),
                            ),
                            // Small triangle pointing down
                            CustomPaint(
                              size: const Size(10, 6),
                              painter: _TrianglePainter(color: AppColors.textDark),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),

          // ── 2. Floating Search Pill (Top) ──────────────────────────
          Positioned(
            top: MediaQuery.of(context).padding.top + 16,
            left: 20,
            right: 20,
            child: GestureDetector(
              onTap: _showSearchModal,
              child: Container(
                height: 56,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(30),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 10, offset: const Offset(0, 4)),
                  ],
                ),
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    const Icon(Icons.search_rounded, color: AppColors.textDark, size: 24),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Toutes les prestations',
                            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textDark),
                          ),
                          Text(
                            'Position actuelle',
                            style: GoogleFonts.inter(fontSize: 12, color: AppColors.textGray),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Icon(Icons.format_list_bulleted_rounded, color: AppColors.textDark, size: 18),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ── 3. Draggable List Sheet (Bottom) ────────────────────────
          DraggableScrollableSheet(
            initialChildSize: 0.45,
            minChildSize: 0.15,
            maxChildSize: 0.9,
            builder: (context, scrollController) {
              return Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                  boxShadow: [
                    BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, -2)),
                  ],
                ),
                child: CustomScrollView(
                  controller: scrollController,
                  slivers: [
                    // Sheet Handle and Filters
                    SliverToBoxAdapter(
                      child: Column(
                        children: [
                          const SizedBox(height: 12),
                          Center(
                            child: Container(
                              width: 40,
                              height: 4,
                              decoration: BoxDecoration(
                                color: AppColors.border,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          // Filters row
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Row(
                              children: [
                                // Tune icon
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: AppColors.border),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.tune_rounded, size: 18, color: AppColors.textDark),
                                ),
                                const SizedBox(width: 8),
                                // Etablissements chip
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: AppColors.border),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(
                                    children: [
                                      Text('Établissements', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500)),
                                      const SizedBox(width: 4),
                                      const Icon(Icons.keyboard_arrow_down_rounded, size: 16),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                // Meilleure correspondance chip
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: AppColors.border),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(
                                    children: [
                                      Text('Meilleure correspondance', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500)),
                                      const SizedBox(width: 4),
                                      const Icon(Icons.keyboard_arrow_down_rounded, size: 16),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            child: Row(
                              children: [
                                Text(
                                  '${results.length} établissements à proximité',
                                  style: GoogleFonts.inter(fontSize: 14, color: AppColors.textGray, fontWeight: FontWeight.w500),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],
                      ),
                    ),
                    
                    // Venue List
                    SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final venue = results[index];
                            return _VenueCard(
                              venue: venue,
                              isLiked: _likedVenues.contains(venue.id),
                              onLike: () => _toggleLike(venue.id),
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => VenueDetailScreen(venue: venue)),
                                );
                              },
                            );
                          },
                          childCount: results.length,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

// Custom painter for the little triangle under the marker bubble
class _TrianglePainter extends CustomPainter {
  final Color color;
  _TrianglePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    final path = Path();
    path.moveTo(0, 0);
    path.lineTo(size.width, 0);
    path.lineTo(size.width / 2, size.height);
    path.close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ── Venue Card ──────────────────────────────────────────────────────────────

class _VenueCard extends StatelessWidget {
  final VenueItem venue;
  final bool isLiked;
  final VoidCallback onLike;
  final VoidCallback onTap;

  const _VenueCard({
    required this.venue,
    required this.isLiked,
    required this.onLike,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.network(
                    venue.image,
                    height: 200,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      height: 200,
                      color: AppColors.surface,
                      child: const Icon(Icons.image_rounded, color: AppColors.textLight, size: 48),
                    ),
                  ),
                ),
                Positioned(
                  top: 12,
                  right: 12,
                  child: GestureDetector(
                    onTap: onLike,
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 6)],
                      ),
                      child: Icon(
                        isLiked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                        size: 18,
                        color: isLiked ? const Color(0xFFEF4444) : AppColors.textGray,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    venue.name,
                    style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textDark),
                  ),
                ),
                Row(
                  children: [
                    const Icon(Icons.star_rounded, size: 16, color: AppColors.starColor),
                    const SizedBox(width: 4),
                    Text(venue.rating.toString().replaceAll('.', ','), style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '${venue.distance} · ${venue.location}',
              style: GoogleFonts.inter(fontSize: 14, color: AppColors.textGray),
            ),
            const SizedBox(height: 4),
            Text(
              '${venue.category} · ${venue.reviews} avis',
              style: GoogleFonts.inter(fontSize: 14, color: AppColors.textGray),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Search Modal ─────────────────────────────────────────────────────────────

class _SearchModal extends StatelessWidget {
  final List<String> recentSearches;
  final VoidCallback onClearRecent;

  const _SearchModal({
    required this.recentSearches,
    required this.onClearRecent,
  });

  static const _popularCategories = [
    {'icon': Icons.apps_rounded,       'label': 'Toutes les prestations'},
    {'icon': Icons.content_cut,        'label': 'Coupes et coiffures'},
    {'icon': Icons.spa_outlined,       'label': 'Salons de manucure'},
    {'icon': Icons.remove_red_eye_outlined, 'label': 'Sourcils et cils'},
    {'icon': Icons.dry_cleaning_outlined,   'label': 'Épilations'},
    {'icon': Icons.self_improvement,        'label': 'Massages'},
  ];

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) {
        return Column(
          children: [
            // ── Header ──────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 16, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Rechercher',
                    style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded, size: 24),
                    splashRadius: 20,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // ── Three input fields ───────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  // Prestations
                  _InputRow(
                    icon: Icons.search_rounded,
                    placeholder: "N'importe quels soins, établissements ...",
                  ),
                  const SizedBox(height: 10),
                  // Location
                  _InputRow(
                    icon: Icons.location_on_outlined,
                    placeholder: 'Position actuelle',
                  ),
                  const SizedBox(height: 10),
                  // Date
                  _InputRow(
                    icon: Icons.calendar_today_outlined,
                    placeholder: 'À tout moment',
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ── Scrollable body ──────────────────────
            Expanded(
              child: ListView(
                controller: scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  // Recent
                  if (recentSearches.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Récent', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700)),
                        GestureDetector(
                          onTap: () {
                            onClearRecent();
                            Navigator.pop(context);
                          },
                          child: Text(
                            'Effacer',
                            style: GoogleFonts.inter(fontSize: 14, color: AppColors.primary, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ...recentSearches.map((s) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        children: [
                          Container(
                            width: 36, height: 36,
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.search_rounded, size: 18, color: AppColors.textGray),
                          ),
                          const SizedBox(width: 14),
                          Text(s, style: GoogleFonts.inter(fontSize: 15, color: AppColors.textDark)),
                        ],
                      ),
                    )),
                    const SizedBox(height: 20),
                  ],

                  // Categories populaires
                  Text('Catégories les plus populaires',
                    style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 16),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 2.6,
                    ),
                    itemCount: _popularCategories.length,
                    itemBuilder: (context, index) {
                      final cat = _popularCategories[index];
                      return GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFFF5F5F7),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          child: Row(
                            children: [
                              Icon(cat['icon'] as IconData, size: 22, color: AppColors.textDark),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  cat['label'] as String,
                                  maxLines: 2,
                                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textDark),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),

            // ── Bottom Rechercher button ─────────────
            Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.of(context).padding.bottom + 16),
              child: SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.textDark,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                  ),
                  child: Text('Rechercher',
                    style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _InputRow extends StatelessWidget {
  final IconData icon;
  final String placeholder;
  const _InputRow({required this.icon, required this.placeholder});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColors.textGray),
          const SizedBox(width: 12),
          Text(placeholder,
            style: GoogleFonts.inter(fontSize: 14, color: AppColors.textGray)),
        ],
      ),
    );
  }
}
