import ExpoModulesCore
import CoreHaptics
import UIKit

public class CoreHapticsModule: Module {
  private var engine: CHHapticEngine?
  private let hapticQueue = DispatchQueue(label: "com.sudokitty.haptics")
  private var engineNeedsRestart = true
  private lazy var supportsHaptics: Bool = {
    CHHapticEngine.capabilitiesForHardware().supportsHaptics
  }()

  public func definition() -> ModuleDefinition {
    Name("CoreHaptics")

    Constant("supportsHaptics") {
      CHHapticEngine.capabilitiesForHardware().supportsHaptics
    }

    Function("play") { (patternName: String) in
      self.playPattern(patternName)
    }

    OnStartObserving {
      NotificationCenter.default.addObserver(
        forName: UIApplication.didEnterBackgroundNotification,
        object: nil, queue: .main
      ) { [weak self] _ in
        self?.stopEngine()
      }
    }
  }

  private func ensureEngine() {
    guard supportsHaptics else { return }
    guard engineNeedsRestart || engine == nil else { return }

    do {
      let eng = try CHHapticEngine()
      eng.stoppedHandler = { [weak self] _ in
        self?.hapticQueue.async { self?.engineNeedsRestart = true }
      }
      eng.resetHandler = { [weak self] in
        self?.hapticQueue.async {
          try? self?.engine?.start()
          self?.engineNeedsRestart = false
        }
      }
      eng.isAutoShutdownEnabled = true
      try eng.start()
      engine = eng
      engineNeedsRestart = false
    } catch {
      engine = nil
    }
  }

  private func stopEngine() {
    engine?.stop()
    engineNeedsRestart = true
  }

  private func playPattern(_ name: String) {
    hapticQueue.async { [weak self] in
      guard let self, self.supportsHaptics else { return }
      self.ensureEngine()
      guard let engine = self.engine,
            let pattern = self.buildPattern(name) else { return }
      do {
        let player = try engine.makePlayer(with: pattern)
        try player.start(atTime: CHHapticTimeImmediate)
      } catch { /* silently fail */ }
    }
  }

  private func buildPattern(_ name: String) -> CHHapticPattern? {
    switch name {
    case "selection":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.25),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.5),
        ], relativeTime: 0),
      ], parameters: [])

    case "tap":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.5),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.6),
        ], relativeTime: 0),
      ], parameters: [])

    case "tapHeavy":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.8),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.35),
        ], relativeTime: 0),
      ], parameters: [])

    case "correct":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.4),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.5),
        ], relativeTime: 0),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.7),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.6),
        ], relativeTime: 0.08),
      ], parameters: [])

    case "unitComplete":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.35),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.5),
        ], relativeTime: 0),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.55),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.6),
        ], relativeTime: 0.1),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.8),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.7),
        ], relativeTime: 0.2),
      ], parameters: [])

    case "mistake":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.8),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.9),
        ], relativeTime: 0),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.6),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.9),
        ], relativeTime: 0.1),
      ], parameters: [])

    case "gameWon":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticContinuous, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.3),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.3),
        ], relativeTime: 0, duration: 0.4),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 1.0),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.5),
        ], relativeTime: 0.4),
      ], parameterCurves: [
        CHHapticParameterCurve(
          parameterID: .hapticIntensityControl,
          controlPoints: [
            CHHapticParameterCurve.ControlPoint(relativeTime: 0, value: 0.3),
            CHHapticParameterCurve.ControlPoint(relativeTime: 0.4, value: 0.9),
          ],
          relativeTime: 0
        ),
      ])

    case "gameLost":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 1.0),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.3),
        ], relativeTime: 0),
        CHHapticEvent(eventType: .hapticContinuous, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.6),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.1),
        ], relativeTime: 0.05, duration: 0.3),
      ], parameterCurves: [
        CHHapticParameterCurve(
          parameterID: .hapticIntensityControl,
          controlPoints: [
            CHHapticParameterCurve.ControlPoint(relativeTime: 0.05, value: 0.6),
            CHHapticParameterCurve.ControlPoint(relativeTime: 0.35, value: 0.0),
          ],
          relativeTime: 0
        ),
      ])

    default:
      return nil
    }
  }
}
