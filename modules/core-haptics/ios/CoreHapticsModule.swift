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

    // ───── Utility (unchanged — keep crisp) ─────

    case "selection":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.35),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.55),
        ], relativeTime: 0),
      ], parameters: [])

    case "tap":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.6),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.65),
        ], relativeTime: 0),
      ], parameters: [])

    case "tapHeavy":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.9),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.4),
        ], relativeTime: 0),
      ], parameters: [])

    case "carouselSwipe":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.78),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.72),
        ], relativeTime: 0),
      ], parameters: [])

    // ───── New utility patterns ─────

    case "pencilMark":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.2),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.75),
        ], relativeTime: 0),
      ], parameters: [])

    case "erase":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.4),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.2),
        ], relativeTime: 0),
        CHHapticEvent(eventType: .hapticContinuous, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.15),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.1),
        ], relativeTime: 0.02, duration: 0.08),
      ], parameters: [])

    // ───── Feedback patterns (upgraded) ─────

    case "correct":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.5),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.45),
        ], relativeTime: 0),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.8),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.7),
        ], relativeTime: 0.08),
        CHHapticEvent(eventType: .hapticContinuous, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.3),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.25),
        ], relativeTime: 0.12, duration: 0.15),
      ], parameterCurves: [
        CHHapticParameterCurve(
          parameterID: .hapticIntensityControl,
          controlPoints: [
            CHHapticParameterCurve.ControlPoint(relativeTime: 0.12, value: 0.3),
            CHHapticParameterCurve.ControlPoint(relativeTime: 0.27, value: 0.0),
          ],
          relativeTime: 0
        ),
      ])

    case "mistake":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 1.0),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.95),
        ], relativeTime: 0),
        CHHapticEvent(eventType: .hapticContinuous, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.7),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.9),
        ], relativeTime: 0.03, duration: 0.2),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.5),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.8),
        ], relativeTime: 0.15),
      ], parameterCurves: [
        CHHapticParameterCurve(
          parameterID: .hapticIntensityControl,
          controlPoints: [
            CHHapticParameterCurve.ControlPoint(relativeTime: 0.03, value: 0.7),
            CHHapticParameterCurve.ControlPoint(relativeTime: 0.23, value: 0.0),
          ],
          relativeTime: 0
        ),
      ])

    // ───── Achievement patterns (upgraded) ─────

    case "unitComplete":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticContinuous, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.15),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.15),
        ], relativeTime: 0, duration: 0.25),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.4),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.5),
        ], relativeTime: 0.02),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.6),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.6),
        ], relativeTime: 0.09),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.85),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.75),
        ], relativeTime: 0.17),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 1.0),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.55),
        ], relativeTime: 0.27),
      ], parameterCurves: [
        CHHapticParameterCurve(
          parameterID: .hapticIntensityControl,
          controlPoints: [
            CHHapticParameterCurve.ControlPoint(relativeTime: 0, value: 0.15),
            CHHapticParameterCurve.ControlPoint(relativeTime: 0.25, value: 0.6),
          ],
          relativeTime: 0
        ),
      ])

    case "gameWon":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.3),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.8),
        ], relativeTime: 0),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.45),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.85),
        ], relativeTime: 0.04),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.6),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.9),
        ], relativeTime: 0.08),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.75),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.85),
        ], relativeTime: 0.12),
        CHHapticEvent(eventType: .hapticContinuous, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.4),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.3),
        ], relativeTime: 0.18, duration: 0.4),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 1.0),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.5),
        ], relativeTime: 0.58),
      ], parameterCurves: [
        CHHapticParameterCurve(
          parameterID: .hapticIntensityControl,
          controlPoints: [
            CHHapticParameterCurve.ControlPoint(relativeTime: 0.18, value: 0.35),
            CHHapticParameterCurve.ControlPoint(relativeTime: 0.45, value: 0.95),
            CHHapticParameterCurve.ControlPoint(relativeTime: 0.58, value: 0.7),
          ],
          relativeTime: 0
        ),
      ])

    case "gameLost":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 1.0),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.25),
        ], relativeTime: 0),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.6),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.2),
        ], relativeTime: 0.12),
        CHHapticEvent(eventType: .hapticContinuous, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.5),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.1),
        ], relativeTime: 0.15, duration: 0.5),
      ], parameterCurves: [
        CHHapticParameterCurve(
          parameterID: .hapticIntensityControl,
          controlPoints: [
            CHHapticParameterCurve.ControlPoint(relativeTime: 0.15, value: 0.5),
            CHHapticParameterCurve.ControlPoint(relativeTime: 0.4, value: 0.2),
            CHHapticParameterCurve.ControlPoint(relativeTime: 0.65, value: 0.0),
          ],
          relativeTime: 0
        ),
      ])

    // ───── New achievement/progression patterns ─────

    case "streak":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.5),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.5),
        ], relativeTime: 0),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.9),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.6),
        ], relativeTime: 0.1),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.45),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.4),
        ], relativeTime: 0.18),
      ], parameters: [])

    case "levelUp":
      return try? CHHapticPattern(events: [
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.25),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.7),
        ], relativeTime: 0),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.35),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.75),
        ], relativeTime: 0.035),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.5),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.8),
        ], relativeTime: 0.07),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.65),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.85),
        ], relativeTime: 0.105),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.8),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.9),
        ], relativeTime: 0.14),
        CHHapticEvent(eventType: .hapticContinuous, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.5),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.35),
        ], relativeTime: 0.2, duration: 0.3),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.7),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.45),
        ], relativeTime: 0.52),
        CHHapticEvent(eventType: .hapticTransient, parameters: [
          CHHapticEventParameter(parameterID: .hapticIntensity, value: 1.0),
          CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.5),
        ], relativeTime: 0.62),
      ], parameterCurves: [
        CHHapticParameterCurve(
          parameterID: .hapticIntensityControl,
          controlPoints: [
            CHHapticParameterCurve.ControlPoint(relativeTime: 0.2, value: 0.4),
            CHHapticParameterCurve.ControlPoint(relativeTime: 0.38, value: 0.85),
            CHHapticParameterCurve.ControlPoint(relativeTime: 0.5, value: 0.5),
          ],
          relativeTime: 0
        ),
      ])

    default:
      return nil
    }
  }
}
