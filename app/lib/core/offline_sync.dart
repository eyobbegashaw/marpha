import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

class OfflineSyncManager {
  static const String _offlineQueueKey = 'offline_sales_queue';

  /// Queue a sale transaction locally when mobile connection is offline
  static Future<void> enqueueOfflineSale(Map<String, dynamic> salePayload) async {
    final prefs = await SharedPreferences.getInstance();
    final List<String> queue = prefs.getStringList(_offlineQueueKey) ?? [];
    queue.add(jsonEncode(salePayload));
    await prefs.setStringList(_offlineQueueKey, queue);
  }

  /// Synchronize queued offline transactions when network is restored
  static Future<int> syncPendingTransactions() async {
    final prefs = await SharedPreferences.getInstance();
    final List<String> queue = prefs.getStringList(_offlineQueueKey) ?? [];
    if (queue.isEmpty) return 0;

    int syncedCount = 0;
    final List<String> remaining = [];

    for (final itemStr in queue) {
      try {
        final payload = jsonDecode(itemStr) as Map<String, dynamic>;
        await ApiClient.post('/sales', payload);
        syncedCount++;
      } catch (e) {
        remaining.add(itemStr);
      }
    }

    await prefs.setStringList(_offlineQueueKey, remaining);
    return syncedCount;
  }

  static Future<int> getPendingQueueCount() async {
    final prefs = await SharedPreferences.getInstance();
    final List<String> queue = prefs.getStringList(_offlineQueueKey) ?? [];
    return queue.length;
  }
}
