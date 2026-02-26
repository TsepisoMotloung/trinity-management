import 'package:intl/intl.dart';

String formatCurrency(double amount) {
  final f = NumberFormat('#,##0.00', 'en_US');
  return 'M ${f.format(amount)}';
}

String formatDate(String? isoDate) {
  if (isoDate == null || isoDate.isEmpty) return '-';
  try {
    final date = DateTime.parse(isoDate);
    return DateFormat('dd MMM yyyy').format(date);
  } catch (_) {
    return isoDate;
  }
}

String formatDateTime(String? isoDate) {
  if (isoDate == null || isoDate.isEmpty) return '-';
  try {
    final date = DateTime.parse(isoDate);
    return DateFormat('dd MMM yyyy, HH:mm').format(date);
  } catch (_) {
    return isoDate;
  }
}

String timeAgo(String? isoDate) {
  if (isoDate == null || isoDate.isEmpty) return '';
  try {
    final date = DateTime.parse(isoDate);
    final diff = DateTime.now().difference(date);
    if (diff.inDays > 30) return '${(diff.inDays / 30).floor()}mo ago';
    if (diff.inDays > 0) return '${diff.inDays}d ago';
    if (diff.inHours > 0) return '${diff.inHours}h ago';
    if (diff.inMinutes > 0) return '${diff.inMinutes}m ago';
    return 'Just now';
  } catch (_) {
    return '';
  }
}
