package com.morningritual.bestpart

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.PowerManager
import java.util.Calendar

class AlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val alarmId = intent.getStringExtra("ALARM_ID") ?: "alarm_550"
        val soundId = intent.getStringExtra("ALARM_SOUND") ?: "our_beautiful_morning"
        val hour = intent.getIntExtra("ALARM_HOUR", 5)
        val minute = intent.getIntExtra("ALARM_MINUTE", 50)
        val title = intent.getStringExtra("ALARM_TITLE") ?: "Our Little Morning Ritual Bestpart ❤️"
        val body = intent.getStringExtra("ALARM_BODY") ?: "A little love waiting for you every morning."

        // 1. Acquire temporary partial wake lock to guarantee screen turns on
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        val wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
            "MorningRitual::AlarmWakeLock"
        )
        wakeLock.acquire(60 * 1000L) // 60 seconds

        // 2. Start foreground AlarmService to play the actual complete instrumental audio
        val serviceIntent = Intent(context, AlarmService::class.java).apply {
            putExtra("ALARM_ID", alarmId)
            putExtra("ALARM_SOUND", soundId)
            putExtra("ALARM_TITLE", title)
            putExtra("ALARM_BODY", body)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }

        // 3. Reschedule the regular repeating alarm for tomorrow (only for base alarms, not snoozes)
        if (!alarmId.contains("snooze")) {
            rescheduleNextDay(context, alarmId, soundId, hour, minute, title, body)
        }
    }

    private fun rescheduleNextDay(
        context: Context,
        alarmId: String,
        soundId: String,
        hour: Int,
        minute: Int,
        title: String,
        body: String
    ) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        val nextCalendar = Calendar.getInstance().apply {
            timeInMillis = System.currentTimeMillis()
            add(Calendar.DAY_OF_YEAR, 1)
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }

        val repeatIntent = Intent(context, AlarmReceiver::class.java).apply {
            action = "com.morningritual.bestpart.TRIGGER_ALARM"
            putExtra("ALARM_ID", alarmId)
            putExtra("ALARM_SOUND", soundId)
            putExtra("ALARM_HOUR", hour)
            putExtra("ALARM_MINUTE", minute)
            putExtra("ALARM_TITLE", title)
            putExtra("ALARM_BODY", body)
        }

        val requestCode = if (alarmId == "alarm_550") 1001 else 1002
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            repeatIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                nextCalendar.timeInMillis,
                pendingIntent
            )
        } else {
            alarmManager.setExact(
                AlarmManager.RTC_WAKEUP,
                nextCalendar.timeInMillis,
                pendingIntent
            )
        }
    }
}
