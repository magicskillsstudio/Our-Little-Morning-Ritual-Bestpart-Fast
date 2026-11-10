package com.morningritual.bestpart

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import java.util.Calendar

/**
 * Reschedules both 5:50 AM and 6:30 AM alarms after phone reboot,
 * system time update, or timezone change.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_TIMEZONE_CHANGED ||
            action == Intent.ACTION_TIME_SET) {

            val prefs = context.getSharedPreferences("MorningRitualAlarms", Context.MODE_PRIVATE)
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

            // Alarm 1: 5:50 AM
            if (prefs.getBoolean("alarm_550_enabled", true)) {
                val hour = prefs.getInt("alarm_550_hour", 5)
                val minute = prefs.getInt("alarm_550_minute", 50)
                schedule(context, alarmManager, "alarm_550", hour, minute, 1001)
            }

            // Alarm 2: 6:30 AM
            if (prefs.getBoolean("alarm_630_enabled", true)) {
                val hour = prefs.getInt("alarm_630_hour", 6)
                val minute = prefs.getInt("alarm_630_minute", 30)
                schedule(context, alarmManager, "alarm_630", hour, minute, 1002)
            }
        }
    }

    private fun schedule(
        context: Context,
        alarmManager: AlarmManager,
        alarmId: String,
        hour: Int,
        minute: Int,
        requestCode: Int
    ) {
        val calendar = Calendar.getInstance().apply {
            timeInMillis = System.currentTimeMillis()
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }

        if (calendar.timeInMillis <= System.currentTimeMillis()) {
            calendar.add(Calendar.DAY_OF_YEAR, 1)
        }

        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = "com.morningritual.bestpart.TRIGGER_ALARM"
            putExtra("ALARM_ID", alarmId)
            putExtra("ALARM_HOUR", hour)
            putExtra("ALARM_MINUTE", minute)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                calendar.timeInMillis,
                pendingIntent
            )
        } else {
            alarmManager.setExact(
                AlarmManager.RTC_WAKEUP,
                calendar.timeInMillis,
                pendingIntent
            )
        }
    }
}
