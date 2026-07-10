import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' hide Path;
import '../constants.dart';
import 'booking_screen.dart';

class VenueDetailScreen extends StatefulWidget {
  final VenueItem venue;
  final ServiceItem? preselectedService;
  const VenueDetailScreen({super.key, required this.venue, this.preselectedService});

  @override
  State<VenueDetailScreen> createState() => _VenueDetailScreenState();
}

class _VenueDetailScreenState extends State<VenueDetailScreen> {
  final _scrollController = ScrollController();
  bool _isLiked = false;
  bool _expandDesc = false;
  int _activeTab = 0;

  static const _tabs = ['À propos', 'Prestations', 'Équipe', 'Avis', 'Autres'];

  // One key per section
  final _keys = List.generate(5, (_) => GlobalKey());

  void _scrollToSection(int index) {
    setState(() => _activeTab = index);
    final ctx = _keys[index].currentContext;
    if (ctx != null) {
      Scrollable.ensureVisible(
        ctx,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
        alignment: 0.0,
      );
    }
  }

  void _openBooking([ServiceItem? service]) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BookingScreen(
          venue: widget.venue,
          preselectedService: service ?? widget.preselectedService,
        ),
      ),
    );
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final venue = widget.venue;

    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        controller: _scrollController,
        slivers: [
          // ── Hero Image ────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 260,
            pinned: true,
            backgroundColor: Colors.white,
            automaticallyImplyLeading: false,
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.pin,
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    venue.image,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(color: AppColors.surface),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.center,
                        colors: [Colors.black.withValues(alpha: 0.35), Colors.transparent],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 12, right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.55),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text('1/9',
                        style: GoogleFonts.inter(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                    ),
                  ),
                ],
              ),
            ),
            leading: Padding(
              padding: const EdgeInsets.all(8),
              child: _CircleBtn(icon: Icons.arrow_back_rounded, onTap: () => Navigator.pop(context)),
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: 4),
                child: _CircleBtn(icon: Icons.share_outlined, onTap: () {}),
              ),
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: _CircleBtn(
                  icon: _isLiked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                  iconColor: _isLiked ? const Color(0xFFEF4444) : AppColors.textDark,
                  onTap: () => setState(() => _isLiked = !_isLiked),
                ),
              ),
            ],
          ),

          // ── Venue info ────────────────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(venue.name,
                    style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.textDark)),
                  const SizedBox(height: 2),
                  Text(venue.category,
                    style: GoogleFonts.inter(fontSize: 14, color: AppColors.textGray)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Icon(Icons.star_rounded, size: 16, color: AppColors.starColor),
                      const SizedBox(width: 4),
                      Text(venue.rating.toString().replaceAll('.', ','),
                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700)),
                      Text(' (${venue.reviews})',
                        style: GoogleFonts.inter(fontSize: 14, color: AppColors.textGray)),
                      const SizedBox(width: 12),
                      const Icon(Icons.circle, size: 8, color: Color(0xFF22C55E)),
                      const SizedBox(width: 4),
                      Text("Ouvert jusqu'à 19:00",
                        style: GoogleFonts.inter(fontSize: 13, color: AppColors.textGray)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.location_on_outlined, size: 16, color: AppColors.textGray),
                        const SizedBox(width: 6),
                        Text('${venue.distance}  ·  ${venue.location}',
                          style: GoogleFonts.inter(fontSize: 13, color: AppColors.textGray)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Sticky tab bar ────────────────────────────────────
          SliverPersistentHeader(
            pinned: true,
            delegate: _TabBarDelegate(
              tabs: _tabs,
              activeIndex: _activeTab,
              onTap: _scrollToSection,
            ),
          ),

          // ── All sections in ONE scroll ────────────────────────
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ─ À propos ─
                Container(
                  key: _keys[0],
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                  child: _AProposSection(
                    venue: venue,
                    expanded: _expandDesc,
                    onToggle: () => setState(() => _expandDesc = !_expandDesc),
                  ),
                ),
                const Divider(height: 32, indent: 20, endIndent: 20, color: AppColors.border),

                // ─ Prestations ─
                Container(
                  key: _keys[1],
                  child: _PrestationsSection(venue: venue, onReserve: _openBooking),
                ),
                const Divider(height: 32, indent: 20, endIndent: 20, color: AppColors.border),

                // ─ Équipe ─
                Container(
                  key: _keys[2],
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: const _EquipeSection(),
                ),
                const Divider(height: 32, indent: 20, endIndent: 20, color: AppColors.border),

                // ─ Avis (Horaires) ─
                Container(
                  key: _keys[3],
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: const _HorairesSection(),
                ),
                const Divider(height: 32, indent: 20, endIndent: 20, color: AppColors.border),

                // ─ Autres (map + nearby) ─
                Container(
                  key: _keys[4],
                  child: _AutresSection(venue: venue),
                ),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),

      // ── Bottom bar ────────────────────────────────────────────
      bottomNavigationBar: Container(
        padding: EdgeInsets.fromLTRB(20, 12, 20, MediaQuery.of(context).padding.bottom + 12),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppColors.border)),
        ),
        child: Row(
          children: [
            Text('${venue.services.length} prestations disponibles',
              style: GoogleFonts.inter(fontSize: 13, color: AppColors.textGray)),
            const Spacer(),
            ElevatedButton(
              onPressed: () => _openBooking(),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.textDark,
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
              ),
              child: Text('Réserver', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Sticky tab bar delegate ───────────────────────────────────────────────────

class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  final List<String> tabs;
  final int activeIndex;
  final void Function(int) onTap;

  const _TabBarDelegate({
    required this.tabs,
    required this.activeIndex,
    required this.onTap,
  });

  static const double _h = 48;

  @override
  double get minExtent => _h + 1;
  @override
  double get maxExtent => _h + 1;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Colors.white,
      child: Column(
        children: [
          SizedBox(
            height: _h,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: tabs.length,
              itemBuilder: (context, i) {
                final active = activeIndex == i;
                return GestureDetector(
                  onTap: () => onTap(i),
                  child: Container(
                    alignment: Alignment.center,
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          color: active ? AppColors.textDark : Colors.transparent,
                          width: 2,
                        ),
                      ),
                    ),
                    child: Text(
                      tabs[i],
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: active ? FontWeight.w700 : FontWeight.w400,
                        color: active ? AppColors.textDark : AppColors.textGray,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const Divider(height: 1, thickness: 1, color: AppColors.border),
        ],
      ),
    );
  }

  @override
  bool shouldRebuild(_TabBarDelegate old) =>
      old.activeIndex != activeIndex || old.tabs != tabs;
}

// ── Small circle icon button ──────────────────────────────────────────────────

class _CircleBtn extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final VoidCallback onTap;
  const _CircleBtn({required this.icon, required this.onTap, this.iconColor = AppColors.textDark});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36, height: 36,
        decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
        child: Icon(icon, size: 20, color: iconColor),
      ),
    );
  }
}

// ── À propos section ──────────────────────────────────────────────────────────

class _AProposSection extends StatelessWidget {
  final VenueItem venue;
  final bool expanded;
  final VoidCallback onToggle;
  const _AProposSection({required this.venue, required this.expanded, required this.onToggle});

  static const _desc =
      'This is a beautifully designed beauty and wellness establishment in the heart of the medina. '
      'Stunning private treatment rooms with vaulted ceilings, restful treatments and world-class service. '
      'A place where you can truly disconnect and recharge.';

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('À propos', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        Text(
          expanded ? _desc : '${_desc.substring(0, 120)}...',
          style: GoogleFonts.inter(fontSize: 14, color: AppColors.textGray, height: 1.6),
        ),
        GestureDetector(
          onTap: onToggle,
          child: Text(
            expanded ? 'Voir moins' : 'Lire la suite',
            style: GoogleFonts.inter(fontSize: 14, color: AppColors.primary, fontWeight: FontWeight.w600),
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }
}

// ── Prestations section ───────────────────────────────────────────────────────

class _PrestationsSection extends StatefulWidget {
  final VenueItem venue;
  final void Function(ServiceItem) onReserve;
  const _PrestationsSection({required this.venue, required this.onReserve});

  @override
  State<_PrestationsSection> createState() => _PrestationsSectionState();
}

class _PrestationsSectionState extends State<_PrestationsSection> {
  int _chip = 0;
  final _chips = ['À la une', 'Face Care', 'Hammam', 'Massage'];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
          child: Text('Prestations',
            style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textDark)),
        ),
        // Filter chips
        SizedBox(
          height: 38,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _chips.length,
            itemBuilder: (context, i) {
              final selected = _chip == i;
              return GestureDetector(
                onTap: () => setState(() => _chip = i),
                child: Container(
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: selected ? AppColors.textDark : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: selected ? AppColors.textDark : AppColors.border),
                  ),
                  child: Text(_chips[i],
                    style: GoogleFonts.inter(
                      fontSize: 13, fontWeight: FontWeight.w600,
                      color: selected ? Colors.white : AppColors.textDark,
                    )),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 20),
        // Services cards
        ...widget.venue.services.map((s) => Container(
          margin: const EdgeInsets.fromLTRB(20, 0, 20, 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: AppColors.border),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(s.name.toUpperCase(),
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textDark)),
                    const SizedBox(height: 4),
                    Text(s.durationMin >= 60 ? '${s.durationMin ~/ 60} h${s.durationMin % 60 == 0 ? '' : ' ${s.durationMin % 60} min'}' : '${s.durationMin} min',
                      style: GoogleFonts.inter(fontSize: 12, color: AppColors.textLight)),
                    const SizedBox(height: 12),
                    Text('${s.price.toInt()} MAD',
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textDark)),
                  ],
                ),
              ),
              OutlinedButton(
                onPressed: () => widget.onReserve(s),
                style: OutlinedButton.styleFrom(
                  backgroundColor: Colors.white,
                  side: const BorderSide(color: AppColors.border),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                  minimumSize: const Size(0, 32),
                ),
                child: Text('Réserver',
                  style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.textDark)),
              ),
            ],
          ),
        )),
        const SizedBox(height: 8),
      ],
    );
  }
}

// ── Équipe section ────────────────────────────────────────────────────────────

class _EquipeSection extends StatelessWidget {
  const _EquipeSection();

  static const _team = [
    {'initial': 'F', 'name': 'Fatiha', 'rating': '4,9', 'image': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop'},
    {'initial': 'H', 'name': 'Houda',  'rating': '4,9', 'image': 'https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?q=80&w=200&auto=format&fit=crop'},
    {'initial': 'A', 'name': 'Ahmed',  'rating': '4,9', 'image': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop'},
  ];

  static const _reviews = [
    {'initials': 'FD', 'name': 'Finty D', 'date': 'mar. 23 juin 2026 à 17:30', 'text': 'Houda was fantastic! Would absolutely recommend.'},
    {'initials': 'SM', 'name': 'Sara M.', 'date': 'lun. 10 juin 2026 à 11:15', 'text': 'Beautiful space and amazing treatments. Will definitely come back!'},
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Équipe', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        Row(
          children: _team.map((m) => Padding(
            padding: const EdgeInsets.only(right: 24),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: const Color(0xFFEDE9FE),
                  backgroundImage: m['image'] != null ? NetworkImage(m['image']!) : null,
                  child: m['image'] == null ? Text(m['initial']!,
                    style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primary)) : null,
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.star_rounded, size: 13, color: AppColors.starColor),
                    const SizedBox(width: 2),
                    Text(m['rating']!, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(m['name']!, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textGray)),
              ],
            ),
          )).toList(),
        ),
        const SizedBox(height: 28),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Avis', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700)),
            Text('Tout voir', style: GoogleFonts.inter(fontSize: 14, color: AppColors.primary, fontWeight: FontWeight.w600)),
          ],
        ),
        const SizedBox(height: 8),
        Row(children: List.generate(5, (_) => const Icon(Icons.star_rounded, size: 28, color: AppColors.starColor))),
        const SizedBox(height: 4),
        Text('4,9 (437)', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        ..._reviews.map((r) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: AppColors.surface,
                  child: Text(r['initials']!,
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textDark)),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(r['name']!, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                    Text(r['date']!, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textGray)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(children: List.generate(5, (_) => const Icon(Icons.star_rounded, size: 16, color: AppColors.starColor))),
            const SizedBox(height: 4),
            Text(r['text']!, style: GoogleFonts.inter(fontSize: 14, color: AppColors.textGray, height: 1.5)),
            const SizedBox(height: 16),
          ],
        )),
      ],
    );
  }
}

// ── Horaires section ──────────────────────────────────────────────────────────

class _HorairesSection extends StatelessWidget {
  const _HorairesSection();

  static const _days = [
    {'day': 'lundi',    'hours': '11:00 - 19:00', 'isToday': false},
    {'day': 'mardi',    'hours': '11:00 - 19:00', 'isToday': false},
    {'day': 'mercredi', 'hours': '11:00 - 19:00', 'isToday': false},
    {'day': 'jeudi',    'hours': '11:00 - 19:00', 'isToday': true},
    {'day': 'vendredi', 'hours': '11:00 - 19:00', 'isToday': false},
    {'day': 'samedi',   'hours': '11:00 - 19:00', 'isToday': false},
    {'day': 'dimanche', 'hours': '11:00 - 19:00', 'isToday': false},
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text("Horaires d'ouverture",
          style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        ..._days.map((d) {
          final isToday = d['isToday'] as bool;
          return Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Row(
              children: [
                const Icon(Icons.circle, size: 10, color: Color(0xFF22C55E)),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(d['day'] as String,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: isToday ? FontWeight.w700 : FontWeight.w400,
                      color: AppColors.textDark,
                    )),
                ),
                Text(d['hours'] as String,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: isToday ? FontWeight.w700 : FontWeight.w400,
                    color: AppColors.textDark,
                  )),
              ],
            ),
          );
        }),
      ],
    );
  }
}

// ── Autres section ────────────────────────────────────────────────────────────

class _AutresSection extends StatelessWidget {
  final VenueItem venue;
  const _AutresSection({required this.venue});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: SizedBox(
              height: 180,
            child: FlutterMap(
              options: MapOptions(
                initialCenter: LatLng(venue.latitude, venue.longitude),
                initialZoom: 14,
                interactionOptions: const InteractionOptions(flags: InteractiveFlag.none),
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.example.mobile_app',
                ),
                MarkerLayer(
                  markers: [
                    Marker(
                      point: LatLng(venue.latitude, venue.longitude),
                      width: 50, height: 40,
                      alignment: Alignment.topCenter,
                      child: const _RatingMarker(),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
          child: RichText(
            text: TextSpan(
              style: GoogleFonts.inter(fontSize: 13, color: AppColors.textDark, height: 1.5),
              children: [
                TextSpan(text: venue.location),
                const TextSpan(text: ' . '),
                TextSpan(
                  text: "Afficher l'itinéraire",
                  style: GoogleFonts.inter(fontSize: 13, color: AppColors.purpleAccent, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text('Établissements à proximité',
            style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700)),
        ),
        const SizedBox(height: 14),
        SizedBox(
          height: 190,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: allVenues.length,
            itemBuilder: (context, index) {
              final v = allVenues[index];
              return GestureDetector(
                onTap: () => Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => VenueDetailScreen(venue: v)),
                ),
                child: Container(
                  width: 160,
                  margin: const EdgeInsets.only(right: 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Image.network(v.image,
                          height: 110, width: 160, fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(height: 110, color: AppColors.surface)),
                      ),
                      const SizedBox(height: 8),
                      Text(v.name, maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700)),
                      Text(v.location, maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(fontSize: 11, color: AppColors.textGray)),
                      Row(
                        children: [
                          const Icon(Icons.star_rounded, size: 12, color: AppColors.starColor),
                          const SizedBox(width: 2),
                          Text('${v.rating}  ·  ${v.reviews} avis',
                            style: GoogleFonts.inter(fontSize: 11, color: AppColors.textGray)),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

// ── Map marker ────────────────────────────────────────────────────────────────

class _RatingMarker extends StatelessWidget {
  const _RatingMarker();
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.textDark,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text('4,9',
            style: GoogleFonts.inter(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700)),
        ),
        CustomPaint(size: const Size(10, 6), painter: _TriPainter()),
      ],
    );
  }
}

class _TriPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()..color = AppColors.textDark;
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width / 2, size.height)
      ..close();
    canvas.drawPath(path, p);
  }
  @override
  bool shouldRepaint(covariant CustomPainter _) => false;
}
