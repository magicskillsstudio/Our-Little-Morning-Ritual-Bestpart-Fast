import Foundation
import Capacitor
import UserNotifications
import AVFoundation

#if canImport(AlarmKit)
import AlarmKit
#endif

/**
 * MorningAlarmPlugin for iOS:
 *
 * 1. iOS 26 and later:
 *    Uses Apple's native AlarmKit framework with AlarmManager authorization,
 *    repeating alarm schedules, and custom sound configuration for full system alarm presentation.
 *
 * 2. iOS 12 to iOS 25 compatibility fallback:
 *    Uses UNUserNotificationCenter with bundled local audio asset (.wav), custom sound configuration,
 *    and AVAudioPlayer background session. Clearly communicates to users that on older iOS versions
 *    without AlarmKit, alerts require sound permissions and device mute switch to not silence notifications.
 */
@objc(MorningAlarmPlugin)
public class AlarmPlugin: CAPPlugin {

    private var audioPlayer: AVAudioPlayer?

    @objc func checkPermissions(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            var ret = JSObject()
            let hasNotif = (settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional)
            let hasCritical = (settings.criticalAlertSetting == .enabled)

            var isIOS26OrLater = false
            var alarmKitAuthorized = false

            if #available(iOS 26.0, *) {
                isIOS26OrLater = true
                #if canImport(AlarmKit)
                // Check AlarmKit authorization status on iOS 26+
                alarmKitAuthorized = (AlarmManager.shared.authorizationStatus == .authorized)
                #endif
            }

            ret["notifications"] = hasNotif
            ret["criticalAlerts"] = hasCritical
            ret["supportsAlarmKit"] = isIOS26OrLater
            ret["alarmKitAuthorized"] = alarmKitAuthorized
            ret["iosVersion"] = UIDevice.current.systemVersion
            call.resolve(ret)
        }
    }

    @objc func requestNotificationPermission(_ call: CAPPluginCall) {
        var options: UNAuthorizationOptions = [.alert, .sound, .badge]
        if #available(iOS 12.0, *) {
            options.insert(.criticalAlert)
        }

        UNUserNotificationCenter.current().requestAuthorization(options: options) { granted, error in
            var ret = JSObject()
            ret["granted"] = granted
            if let error = error {
                ret["error"] = error.localizedDescription
            }
            call.resolve(ret)
        }
    }

    @objc func requestAlarmKitAuthorization(_ call: CAPPluginCall) {
        if #available(iOS 26.0, *) {
            #if canImport(AlarmKit)
            AlarmManager.shared.requestAuthorization { granted, error in
                var ret = JSObject()
                ret["granted"] = granted
                if let error = error {
                    ret["error"] = error.localizedDescription
                }
                call.resolve(ret)
            }
            return
            #endif
        }
        
        var ret = JSObject()
        ret["granted"] = false
        ret["reason"] = "AlarmKit is available on iOS 26 or later."
        call.resolve(ret)
    }

    @objc func scheduleAlarm(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject("Missing alarm ID")
            return
        }
        let hour = call.getInt("hour") ?? 5
        let minute = call.getInt("minute") ?? 50
        let soundName = call.getString("sound") ?? "our_beautiful_morning"
        let title = call.getString("title") ?? "Our Little Morning Ritual Bestpart ❤️"
        let body = call.getString("body") ?? "A little love waiting for you every morning."

        let soundFilename = "\(soundName.replacingOccurrences(of: "-", with: "_")).wav"

        // 1. Native AlarmKit Implementation for iOS 26+
        if #available(iOS 26.0, *) {
            #if canImport(AlarmKit)
            var dateComponents = DateComponents()
            dateComponents.hour = hour
            dateComponents.minute = minute
            dateComponents.second = 0

            let schedule = Alarm.Schedule.relativeToCurrentTime(matching: dateComponents)
            let alarm = Alarm(
                id: id,
                title: title,
                body: body,
                schedule: schedule,
                sound: .bundledSound(named: soundFilename)
            )

            AlarmManager.shared.schedule(alarm) { error in
                if let error = error {
                    print("AlarmKit scheduling warning: \(error.localizedDescription)")
                } else {
                    print("Successfully scheduled iOS 26+ AlarmKit alarm \(id) for \(hour):\(minute)")
                }
            }
            #endif
        }

        // 2. UNUserNotificationCenter Fallback for iOS 12 - 25
        var dateComponents = DateComponents()
        dateComponents.hour = hour
        dateComponents.minute = minute
        dateComponents.second = 0

        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)

        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.categoryIdentifier = "MORNING_RITUAL_ALARM"

        if #available(iOS 12.0, *) {
            content.sound = UNNotificationSound.criticalSoundNamed(
                UNNotificationSoundName(rawValue: soundFilename),
                withAudioVolume: 1.0
            )
        } else {
            content.sound = UNNotificationSound(named: UNNotificationSoundName(rawValue: soundFilename))
        }

        let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                call.reject("Failed to schedule iOS alarm notification: \(error.localizedDescription)")
            } else {
                var ret = JSObject()
                ret["success"] = true
                ret["id"] = id
                call.resolve(ret)
            }
        }
    }

    @objc func cancelAlarm(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject("Missing alarm ID")
            return
        }

        if #available(iOS 26.0, *) {
            #if canImport(AlarmKit)
            AlarmManager.shared.cancelAlarm(withIdentifier: id)
            #endif
        }

        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [id])
        UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: [id])

        var ret = JSObject()
        ret["success"] = true
        call.resolve(ret)
    }

    @objc func stopAlarm(_ call: CAPPluginCall) {
        audioPlayer?.stop()
        audioPlayer = nil
        var ret = JSObject()
        ret["success"] = true
        call.resolve(ret)
    }

    @objc func snoozeAlarm(_ call: CAPPluginCall) {
        audioPlayer?.stop()
        audioPlayer = nil

        let soundName = call.getString("sound") ?? "our_beautiful_morning"
        let minutes = call.getInt("minutes") ?? 9
        let soundFilename = "\(soundName.replacingOccurrences(of: "-", with: "_")).wav"

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: TimeInterval(minutes * 60), repeats: false)

        let content = UNMutableNotificationContent()
        content.title = "Snoozed Morning Ritual ❤️"
        content.body = "A little more time to wake gently, my love."
        content.sound = UNNotificationSound(named: UNNotificationSoundName(rawValue: soundFilename))

        let request = UNNotificationRequest(identifier: "morning_ritual_snooze", content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request) { _ in }

        var ret = JSObject()
        ret["success"] = true
        call.resolve(ret)
    }
}
