import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../constants/app_colors.dart';

class CaisseScreen extends StatefulWidget {
  const CaisseScreen({super.key});

  @override
  State<CaisseScreen> createState() => _CaisseScreenState();
}

class _CaisseScreenState extends State<CaisseScreen> {
  int _selectedPeriod = 0; // 0=aujourd'hui, 1=semaine, 2=mois
  final List<String> _periods = ['Aujourd\'hui', 'Cette semaine', 'Ce mois'];

  final List<Map<String, dynamic>> _transactions = [
    {
      'id': 'TXN-001',
      'client': 'Yasmine Benali',
      'service': 'Coupe + Brushing',
      'amount': 250.0,
      'method': 'Carte',
      'status': 'paid',
      'time': '09:45',
      'employee': 'Samira Bouzid',
    },
    {
      'id': 'TXN-002',
      'client': 'Khalid Amrani',
      'service': 'Barbe + Coupe',
      'amount': 120.0,
      'method': 'Espèces',
      'status': 'paid',
      'time': '11:20',
      'employee': 'Yassine El Fassi',
    },
    {
      'id': 'TXN-003',
      'client': 'Nadia Alaoui',
      'service': 'Coloration',
      'amount': 450.0,
      'method': 'Carte',
      'status': 'pending',
      'time': '12:30',
      'employee': 'Samira Bouzid',
    },
    {
      'id': 'TXN-004',
      'client': 'Omar Tazi',
      'service': 'Soin du visage',
      'amount': 180.0,
      'method': 'Espèces',
      'status': 'paid',
      'time': '14:15',
      'employee': 'Khalid Ait Lahcen',
    },
    {
      'id': 'TXN-005',
      'client': 'Fatima Zahra',
      'service': 'Manucure',
      'amount': 90.0,
      'method': 'Virement',
      'status': 'cancelled',
      'time': '15:00',
      'employee': 'Nadia El Khatib',
    },
    {
      'id': 'TXN-006',
      'client': 'Hicham Berrada',
      'service': 'Massage relaxant',
      'amount': 320.0,
      'method': 'Carte',
      'status': 'paid',
      'time': '16:30',
      'employee': 'Khalid Ait Lahcen',
    },
  ];

  double get _totalRevenue => _transactions
      .where((t) => t['status'] == 'paid')
      .fold(0.0, (sum, t) => sum + (t['amount'] as double));

  double get _pendingRevenue => _transactions
      .where((t) => t['status'] == 'pending')
      .fold(0.0, (sum, t) => sum + (t['amount'] as double));

  int get _paidCount =>
      _transactions.where((t) => t['status'] == 'paid').length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          _buildAppBar(),
          SliverToBoxAdapter(child: _buildPeriodSelector()),
          SliverToBoxAdapter(child: _buildRevenueCard()),
          SliverToBoxAdapter(child: _buildPaymentBreakdown()),
          SliverToBoxAdapter(child: _buildTransactionsHeader()),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (ctx, i) => _buildTransactionItem(_transactions[i]),
              childCount: _transactions.length,
            ),
          ),
          const SliverPadding(padding: EdgeInsets.only(bottom: 100)),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showNewTransactionSheet(),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        icon: const Icon(Icons.add_rounded, size: 22),
        label: Text(
          'Nouvelle vente',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 14),
        ),
      ),
    );
  }

  SliverAppBar _buildAppBar() {
    return SliverAppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      pinned: false,
      floating: true,
      snap: true,
      expandedHeight: 70,
      flexibleSpace: FlexibleSpaceBar(
        titlePadding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
        title: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Caisse',
                      style: GoogleFonts.outfit(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textDark)),
                  Text(
                    DateFormat('d MMMM yyyy', 'fr_FR').format(DateTime.now()),
                    style: GoogleFonts.outfit(
                        fontSize: 11, color: AppColors.textGray, fontWeight: FontWeight.w500),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.confirmedBg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.circle, color: AppColors.confirmed, size: 8),
                  const SizedBox(width: 6),
                  Text(
                    'Ouvert',
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.confirmed,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPeriodSelector() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: List.generate(_periods.length, (i) {
            final selected = i == _selectedPeriod;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedPeriod = i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.all(4),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.primary : Colors.transparent,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    _periods[i],
                    textAlign: TextAlign.center,
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: selected ? Colors.white : AppColors.textGray,
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }

  Widget _buildRevenueCard() {
    final multiplier = _selectedPeriod == 0 ? 1.0 : _selectedPeriod == 1 ? 6.5 : 28.0;
    final revenue = _totalRevenue * multiplier;
    final pending = _pendingRevenue;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF059669), Color(0xFF10B981)],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Chiffre d\'affaires',
            style: GoogleFonts.outfit(
              fontSize: 13,
              color: Colors.white70,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${revenue.toStringAsFixed(0)} DH',
            style: GoogleFonts.outfit(
              fontSize: 38,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.trending_up_rounded, color: Colors.white70, size: 16),
              const SizedBox(width: 4),
              Text(
                '+12.4% vs période précédente',
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  color: Colors.white70,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _buildRevenueSubCard(
                  '$_paidCount transactions',
                  'Encaissées',
                  Icons.check_circle_outline_rounded,
                  Colors.white,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildRevenueSubCard(
                  '${pending.toStringAsFixed(0)} DH',
                  'En attente',
                  Icons.pending_outlined,
                  Colors.white70,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRevenueSubCard(
      String value, String label, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
              Text(
                label,
                style: GoogleFonts.outfit(
                  fontSize: 10,
                  color: Colors.white70,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentBreakdown() {
    final methods = <String, double>{};
    for (final t in _transactions.where((t) => t['status'] == 'paid')) {
      final m = t['method'] as String;
      methods[m] = (methods[m] ?? 0) + (t['amount'] as double);
    }
    final total = methods.values.fold(0.0, (a, b) => a + b);
    final colors = [AppColors.primary, const Color(0xFF3B82F6), const Color(0xFF8B5CF6)];
    final icons = [Icons.credit_card_rounded, Icons.payments_rounded, Icons.account_balance_rounded];

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Moyens de paiement',
            style: GoogleFonts.outfit(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 14),
          ...methods.entries.toList().asMap().entries.map((entry) {
            final i = entry.key;
            final method = entry.value.key;
            final amount = entry.value.value;
            final pct = total > 0 ? (amount / total * 100) : 0;
            final color = colors[i % colors.length];
            final icon = icons[i % icons.length];
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(icon, color: color, size: 18),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(method,
                                style: GoogleFonts.outfit(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.textDark)),
                            Text('${amount.toStringAsFixed(0)} DH',
                                style: GoogleFonts.outfit(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: color)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: pct / 100,
                            backgroundColor: color.withOpacity(0.12),
                            valueColor: AlwaysStoppedAnimation(color),
                            minHeight: 6,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildTransactionsHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Transactions',
            style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.textDark,
            ),
          ),
          Text(
            '${_transactions.length} opérations',
            style: GoogleFonts.outfit(
              fontSize: 12,
              color: AppColors.textGray,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionItem(Map<String, dynamic> txn) {
    final isPaid = txn['status'] == 'paid';
    final isPending = txn['status'] == 'pending';
    final Color statusColor = isPaid
        ? AppColors.confirmed
        : isPending
            ? AppColors.pending
            : AppColors.cancelled;
    final Color statusBg = isPaid
        ? AppColors.confirmedBg
        : isPending
            ? AppColors.pendingBg
            : AppColors.cancelledBg;
    final String statusLabel = isPaid
        ? 'Payé'
        : isPending
            ? 'En attente'
            : 'Annulé';

    final methodIcon = txn['method'] == 'Carte'
        ? Icons.credit_card_rounded
        : txn['method'] == 'Virement'
            ? Icons.account_balance_rounded
            : Icons.payments_rounded;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(methodIcon, color: AppColors.primary, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      txn['client'],
                      style: GoogleFonts.outfit(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textDark,
                      ),
                    ),
                    Text(
                      '${(txn['amount'] as double).toStringAsFixed(0)} DH',
                      style: GoogleFonts.outfit(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: isPaid ? AppColors.confirmed : AppColors.textDark,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      txn['service'],
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        color: AppColors.textGray,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: statusBg,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        statusLabel,
                        style: GoogleFonts.outfit(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: statusColor,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Wrap(
                  spacing: 12,
                  runSpacing: 6,
                  children: [
                    _iconTextRow(Icons.access_time_rounded, txn['time']),
                    _iconTextRow(Icons.person_outline_rounded, txn['employee']),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showNewTransactionSheet() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Fonctionnalité disponible dans la prochaine version',
          style: GoogleFonts.outfit(fontSize: 13),
        ),
        backgroundColor: AppColors.primary,
      ),
    );
  }

  Widget _iconTextRow(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: AppColors.textLight),
        const SizedBox(width: 4),
        Text(
          text,
          style: GoogleFonts.outfit(fontSize: 11, color: AppColors.textLight),
        ),
      ],
    );
  }
}
