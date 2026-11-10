package com.morningritual.bestpart

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.util.Calendar

@CapacitorPlugin(name = "MorningAlarmPlugin")
class AlarmPlugin : Plugin() {

    @PluginMethod
    fun checkPermissions(call: PluginCall) {
        val context = context
        val ret = JSObject()

        var hasExact = true
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            hasExact = alarmManager.canScheduleExactAlarms()
        }

        ret.put("notifications", true)
        ret.put("exactAlarm", hasExact)
        call.resolve(ret)
    }

    @PluginMethod
    fun requestExactAlarmPermission(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        }
        call.resolve()
    }

    @PluginMethod
    fun scheduleAlarm(call: PluginCall) {
        val id = call.getString("id") ?: "alarm_default"
        val hour = call.getInt("hour") ?: 5
        val minute = call.getInt("minute") ?: 50
        val sound = call.getString("sound") ?: "our_beautiful_morning"
        val title = call.getString("title") ?: "Our Little Morning Ritual Bestpart ❤️"
        val body = call.getString("body") ?: "A little love waiting for you every morning."

        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = "com.morningritual.bestpart.TRIGGER_ALARM"
            putExtra("ALARM_ID", id)
            putExtra("ALARM_HOUR", hour)
            putExtra("ALARM_MINUTE", minute)
            putExtra("ALARM_SOUND", sound)
            putExtra("ALARM_TITLE", title)
            putExtra("ALARM_BODY", body)
        }

        val requestCode = if (id == "alarm_550") 1001 else 1002
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Calculate next occurrence
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

        // Save to SharedPreferences so BootReceiver can recover after restart
        val prefs = context.getSharedPreferences("MorningRitualAlarms", Context.MODE_PRIVATE)
        prefs.edit()
            .putBoolean("${id}_enabled", true)
            .putInt("${id}_hour", hour)
            .putInt("${id}_minute", minute)
            .putString("${id}_sound", sound)
            .apply()

        // Schedule exact alarm with idle wake capability
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

        val res = JSObject()
        res.put("success", true)
        res.put("nextTriggerMs", calendar.timeInMillis)
        call.resolve(res)
    }

    @PluginMethod
    fun cancelAlarm(call: PluginCall) {
        val id = call.getString("id") ?: "alarm_default"
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        val intent = Intent(context, AlarmReceiver::class.java)
        val requestCode = if (id == "alarm_550") 1001 else 1002
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )

        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()
        }

        val prefs = context.getSharedPreferences("MorningRitualAlarms", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("${id}_enabled", false).apply()

        val res = JSObject()
        res.put("success", true)
        call.resolve(res)
    }

    @PluginMethod
    fun stopAlarm(call: PluginCall) {
        // Stop foreground alarm service immediately
        val stopServiceIntent = Intent(context, AlarmService::class.java)
        context.stopService(stopServiceIntent)
        val res = JSObject()
        res.put("success", true)
        call.resolve(res)
    }

    @PluginMethod
    fun snoozeAlarm(call: PluginCall) {
        val id = call.getString("id") ?: "alarm_default"
        val sound = call.getString("sound") ?: "our_beautiful_morning"
        val minutes = call.getInt("minutes") ?: 9

        // 1. Stop active audio
        val stopServiceIntent = Intent(context, AlarmService::class.java)
        context.stopService(stopServiceIntent)

        // 2. Schedule snooze alarm
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val snoozeTimeMs = System.currentTimeMillis() + (minutes * 60 * 1000L)

        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = "com.morningritual.bestpart.TRIGGER_ALARM"
            putExtra("ALARM_ID", "${id}_snooze")
            putExtra("ALARM_SOUND", sound)
            putExtra("ALARM_TITLE", "Snoozed Morning Ritual ❤️")
            putExtra("ALARM_BODY", "A little more time to wake gently, my love.")
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            4001,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                snoozeTimeMs,
                pendingIntent
            )
        } else {
            alarmManager.setExact(
                AlarmManager.RTC_WAKEUP,
                snoozeTimeMs,
                pendingIntent
            )
        }

        val res = JSObject()
        res.put("success", true)
        res.put("snoozeTriggerMs", snoozeTimeMs)
        call.resolve(res)
    }
}
