package com.morningritual.bestpart

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class AlarmActionReceiver : BroadcastReceiver() {

    companion object {
        const val ACTION_STOP = "com.morningritual.bestpart.ACTION_STOP"
        const val ACTION_SNOOZE = "com.morningritual.bestpart.ACTION_SNOOZE"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val alarmId = intent.getStringExtra("ALARM_ID") ?: "alarm_550"
        val soundId = intent.getStringExtra("ALARM_SOUND") ?: "our_beautiful_morning"

        // 1. Always stop current alarm audio service
        val stopServiceIntent = Intent(context, AlarmService::class.java)
        context.stopService(stopServiceIntent)

        if (intent.action == ACTION_SNOOZE) {
            // Schedule 9-minute snooze
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val snoozeTriggerMs = System.currentTimeMillis() + (9 * 60 * 1000L) // 9 minutes

            val snoozeAlarmIntent = Intent(context, AlarmReceiver::class.java).apply {
                action = "com.morningritual.bestpart.TRIGGER_ALARM"
                putExtra("ALARM_ID", "${alarmId}_snooze")
                putExtra("ALARM_SOUND", soundId)
                putExtra("ALARM_TITLE", "Snoozed Morning Ritual ❤️")
                putExtra("ALARM_BODY", "A little more time to wake gently, my love.")
            }

            val pendingIntent = PendingIntent.getBroadcast(
                context,
                4001,
                snoozeAlarmIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    snoozeTriggerMs,
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    snoozeTriggerMs,
                    pendingIntent
                )
            }
        }
    }
}
