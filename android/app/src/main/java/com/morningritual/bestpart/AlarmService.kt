package com.morningritual.bestpart

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat

class AlarmService : Service() {

    private var mediaPlayer: MediaPlayer? = null
    private var volumeHandler: Handler? = null
    private var volumeRunnable: Runnable? = null
    private val CHANNEL_ID = "morning_ritual_foreground_alarm_channel"
    private val NOTIFICATION_ID = 2001

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val alarmId = intent?.getStringExtra("ALARM_ID") ?: "alarm_550"
        val soundId = intent?.getStringExtra("ALARM_SOUND") ?: "our_beautiful_morning"
        val title = intent?.getStringExtra("ALARM_TITLE") ?: "Our Little Morning Ritual Bestpart ❤️"
        val body = intent?.getStringExtra("ALARM_BODY") ?: "A little love waiting for you every morning."

        createNotificationChannel()

        // Notification Actions: STOP and SNOOZE
        val stopIntent = Intent(this, AlarmActionReceiver::class.java).apply {
            action = AlarmActionReceiver.ACTION_STOP
            putExtra("ALARM_ID", alarmId)
        }
        val stopPendingIntent = PendingIntent.getBroadcast(
            this,
            3001,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val snoozeIntent = Intent(this, AlarmActionReceiver::class.java).apply {
            action = AlarmActionReceiver.ACTION_SNOOZE
            putExtra("ALARM_ID", alarmId)
            putExtra("ALARM_SOUND", soundId)
        }
        val snoozePendingIntent = PendingIntent.getBroadcast(
            this,
            3002,
            snoozeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val fullScreenIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            this.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("RINGING_ALARM_ID", alarmId)
            putExtra("ALARM_SOUND", soundId)
        }
        val fullScreenPendingIntent = PendingIntent.getActivity(
            this,
            3003,
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setContentIntent(fullScreenPendingIntent)
            .setOngoing(true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "STOP ALARM", stopPendingIntent)
            .addAction(android.R.drawable.ic_popup_reminder, "SNOOZE (9 MIN)", snoozePendingIntent)
            .build()

        startForeground(NOTIFICATION_ID, notification)

        startAlarmAudio(soundId)

        return START_NOT_STICKY
    }

    private fun startAlarmAudio(soundId: String) {
        stopAlarmAudio()

        val rawResName = soundId.replace("-", "_").lowercase()
        var resId = resources.getIdentifier(rawResName, "raw", packageName)
        if (resId == 0) {
            resId = resources.getIdentifier("our_beautiful_morning", "raw", packageName)
        }

        if (resId != 0) {
            try {
                mediaPlayer = MediaPlayer().apply {
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                            .build()
                    )
                    setDataSource(resources.openRawResourceFd(resId))
                    isLooping = true
                    prepare()
                    setVolume(0.05f, 0.05f) // start gentle
                    start()
                }

                // Gentle fade-in over 12 seconds
                volumeHandler = Handler(Looper.getMainLooper())
                var currentVol = 0.05f
                volumeRunnable = object : Runnable {
                    override fun run() {
                        if (mediaPlayer != null && mediaPlayer?.isPlaying == true) {
                            currentVol += 0.05f
                            if (currentVol >= 1.0f) {
                                mediaPlayer?.setVolume(1.0f, 1.0f)
                            } else {
                                mediaPlayer?.setVolume(currentVol, currentVol)
                                volumeHandler?.postDelayed(this, 600)
                            }
                        }
                    }
                }
                volumeHandler?.postDelayed(volumeRunnable!!, 600)

            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun stopAlarmAudio() {
        volumeRunnable?.let { volumeHandler?.removeCallbacks(it) }
        volumeHandler = null
        volumeRunnable = null

        try {
            if (mediaPlayer?.isPlaying == true) {
                mediaPlayer?.stop()
            }
            mediaPlayer?.release()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        mediaPlayer = null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Romantic Alarm Playback",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Active romantic alarm playing full music arrangement"
                setSound(null, null) // Audio is handled authoritatively by MediaPlayer
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
                enableVibration(true)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        stopAlarmAudio()
        super.onDestroy()
    }
}
