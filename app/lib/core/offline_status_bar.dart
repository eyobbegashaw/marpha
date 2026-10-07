import 'package:flutter/material.dart';
import 'offline_sync.dart';

enum SyncState { online, offline, syncing, synced, syncFailed }

class OfflineStatusBar extends StatefulWidget {
  const OfflineStatusBar({super.key});

  @override
  State<OfflineStatusBar> createState() => _OfflineStatusBarState();
}

class _OfflineStatusBarState extends State<OfflineStatusBar> {
  SyncState _state = SyncState.online;
  int _pendingCount = 0;

  @override
  void initState() {
    super.initState();
    _checkQueue();
  }

  Future<void> _checkQueue() async {
    final count = await OfflineSyncManager.getPendingQueueCount();
    if (mounted) {
      setState(() {
        _pendingCount = count;
        _state = count > 0 ? SyncState.syncing : SyncState.online;
      });
    }
  }

  Future<void> _triggerManualSync() async {
    setState(() => _state = SyncState.syncing);
    try {
      await OfflineSyncManager.syncPendingTransactions();
      final remaining = await OfflineSyncManager.getPendingQueueCount();
      if (mounted) {
        setState(() {
          _pendingCount = remaining;
          _state = remaining == 0 ? SyncState.synced : SyncState.syncFailed;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _state = SyncState.syncFailed);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    IconData icon;
    String label;

    switch (_state) {
      case SyncState.online:
        if (_pendingCount == 0) {
          return const SizedBox.shrink(); // Hide when completely synchronized and online
        }
        bg = Colors.teal.shade50;
        fg = Colors.teal.shade800;
        icon = Icons.check_circle_outline_rounded;
        label = 'ONLINE • All transactions synced';
        break;
      case SyncState.syncing:
        bg = Colors.blue.shade50;
        fg = Colors.blue.shade800;
        icon = Icons.sync_rounded;
        label = 'SYNCING • Processing $_pendingCount pending items...';
        break;
      case SyncState.synced:
        bg = Colors.green.shade50;
        fg = Colors.green.shade800;
        icon = Icons.cloud_done_rounded;
        label = 'SYNCED • Offline queue uploaded successfully';
        break;
      case SyncState.syncFailed:
        bg = Colors.red.shade50;
        fg = Colors.red.shade800;
        icon = Icons.sync_problem_rounded;
        label = 'SYNC FAILED • $_pendingCount items pending. Tap to retry.';
        break;
      case SyncState.offline:
        bg = Colors.amber.shade50;
        fg = Colors.amber.shade900;
        icon = Icons.wifi_off_rounded;
        label = 'OFFLINE • $_pendingCount items queued locally';
        break;
    }

    return InkWell(
      onTap: _triggerManualSync,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        color: bg,
        child: Row(
          children: [
            Icon(icon, size: 16, color: fg),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: fg),
              ),
            ),
            if (_pendingCount > 0)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: fg.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'PENDING ($_pendingCount)',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: fg),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
