import React from 'react'
import {
  Dimensions,
  Keyboard,
  StyleSheet,
  TextInput,
  View,
  SegmentedControlIOS,
  ScrollView,
  Button,
} from 'react-native'
import Animated from 'react-native-reanimated'
import {
  PanGestureHandler,
  State,
  TouchableHighlight,
} from 'react-native-gesture-handler'
import {
  onGestureEvent,
  timing,
  snapPoint,
  withTimingTransition,
} from 'react-native-redash'

const {
  and,
  eq,
  stopClock,
  startClock,
  call,
  add,
  Clock,
  Value,
  cond,
  useCode,
  set,
  block,
  not,
  clockRunning,
  spring: reSpring,
  neq,
  sub,
} = Animated

const { height } = Dimensions.get('window')
const SNAP_TOP = height * 0.25
const SNAP_BOTTOM = height - 200
const SEGMENT_CONTROL_HEIGHT = 40
const HEADER_HEIGHT = 100
console.log('SNAP_BOTTOM', SNAP_BOTTOM)
const textInputRef = React.createRef<TextInput>()
const springClock = new Clock()
const manualOpenClock = new Clock()
const resizeClock = new Clock()
const translationY = new Value(0)
const velocityY = new Value(0)
const goUp: Animated.Value<0 | 1> = new Value(0)
const goDown: Animated.Value<0 | 1> = new Value(0)
const close = () => goDown.setValue(1)
const open = () => goUp.setValue(1)
const state = new Value(State.UNDETERMINED)
const offset = new Value(SNAP_BOTTOM)
const resizeOffset: Animated.Value<number> = new Value(SNAP_BOTTOM)
const keyboardHeight: Animated.Value<number> = new Value(0)
const textInputHeight: Animated.Value<number> = new Value(0)

const config = {
  damping: 15,
  mass: 1,
  stiffness: 100,
  overshootClamping: false,
  restSpeedThreshold: 0.1,
  restDisplacementThreshold: 0.1,
}

const styles = StyleSheet.create({
  playerSheet: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'cyan',
  },
})

interface PrivateSpringConfig extends Animated.SpringConfig {
  toValue: Animated.Value<number>
}

type SpringConfig = Omit<Animated.SpringConfig, 'toValue'>

export interface WithSpringParams {
  value: Animated.Adaptable<number>
  velocity: Animated.Adaptable<number>
  state: Animated.Node<State>
  snapPoints: Animated.Adaptable<number>[]
  springOffset?: Animated.Value<number>
  config?: SpringConfig
  onSnap?: (value: readonly number[]) => void
}

export const withSpring = (props: WithSpringParams) => {
  const {
    value,
    velocity,
    state,
    snapPoints,
    springOffset,
    config: springConfig,
    onSnap,
  } = {
    springOffset: new Value(0),
    ...props,
  }
  const config: PrivateSpringConfig = {
    toValue: new Value(0),
    damping: 6,
    mass: 1,
    stiffness: 64,
    overshootClamping: false,
    restSpeedThreshold: 0.01,
    restDisplacementThreshold: 0.01,
    ...springConfig,
  }

  const springState: Animated.SpringState = {
    finished: new Value(0),
    velocity: new Value(0),
    position: new Value(0),
    time: new Value(0),
  }
  const gestureAndAnimationIsOver = new Value(1)
  const isSpringInterrupted = and(
    eq(state, State.BEGAN),
    clockRunning(springClock),
  )
  const finishSpring = [
    set(springOffset, springState.position),
    // If we just finished the spring gesture, don't automatically use the old offset because it could be wrong
    // In the case that we have resized something and then do another gesture
    // In that case, case 3 below would also be hit because offset and resizeOffset would be different and we would animate offset to resizeOffset
    // This would cause offset to always animate to the last thing that was sized
    set(resizeOffset, springState.position),
    call([resizeOffset], ([resizeOffsetDone]) => {
      console.log('resizeOffsetDONE!!!', resizeOffsetDone)
    }),
    stopClock(springClock),
    set(gestureAndAnimationIsOver, 1),
    // If the sheet is open, focus the textInput
    cond(
      eq(springState.position, SNAP_BOTTOM),
      [
        //closed
        call([springState.position], (position) => {
          console.log(`CLOSED: ${position}`)
          Keyboard.dismiss()
        }),
      ],
      [
        // open
        call([springState.position], ([position]) => {
          console.log(`OPEN: ${position}`)
          textInputRef.current!.focus()
        }),
      ],
    ),
  ]
  const snap = onSnap
    ? [cond(clockRunning(springClock), call([springState.position], onSnap))]
    : []
  return block([
    cond(isSpringInterrupted, finishSpring),
    cond(gestureAndAnimationIsOver, set(springState.position, springOffset)),
    cond(neq(state, State.END), [
      set(gestureAndAnimationIsOver, 0),
      set(springState.finished, 0),
      set(springState.position, add(springOffset, value)),
    ]),
    cond(and(eq(state, State.END), not(gestureAndAnimationIsOver)), [
      cond(and(not(clockRunning(springClock)), not(springState.finished)), [
        set(springState.velocity, velocity),
        set(springState.time, 0),
        set(
          config.toValue,
          snapPoint(springState.position, velocity, snapPoints),
        ),
        startClock(springClock),
      ]),
      reSpring(springClock, springState, config),
      cond(springState.finished, [...snap, ...finishSpring]),
    ]),
    springState.position,
  ])
}

// Animates smoothly b/c the textInputHeight changes at the same time as the offset that controls the sheet position
const textInputHeightTransition = withTimingTransition(textInputHeight)
let textInputWithPadding = 0
let textInputWithoutPadding = 0
let textInputPadding = 0
export default () => {
  const [value, onChangeText] = React.useState('Useless Placeholder')
  React.useEffect(() => {
    Keyboard.addListener('keyboardWillShow', (event) => {
      keyboardHeight.setValue(event.endCoordinates.height)
    })

    Keyboard.addListener('keyboardWillHide', () => {
      // Set to the offset so it goes back to it's current offset state
      resizeOffset.setValue(offset)
      keyboardHeight.setValue(0)
    })
  }, [])
  // Case 1. Drag gesture to open and close
  const gestureHandler = onGestureEvent({ state, translationY, velocityY })
  const translateY = withSpring({
    value: translationY,
    velocity: velocityY,
    springOffset: offset,
    state,
    snapPoints: [SNAP_TOP, SNAP_BOTTOM],
    config,
  })

  // Case 2. Manual open close
  useCode(
    () =>
      block([
        cond(goUp, [
          set(
            offset,
            timing({
              clock: manualOpenClock,
              from: offset,
              to: SNAP_TOP,
              duration: 3000,
            }),
          ),
          cond(not(clockRunning(manualOpenClock)), [
            set(goUp, 0),
            call([], () => {
              textInputRef.current!.focus()
              console.log('OPEN MANUAL')
            }),
          ]),
        ]),
        cond(goDown, [
          set(
            offset,
            timing({
              clock: manualOpenClock,
              from: offset,
              to: SNAP_BOTTOM,
              duration: 3000,
            }),
          ),
          cond(not(clockRunning(manualOpenClock)), [
            set(goDown, 0),
            call([], () => {
              Keyboard.dismiss()
              console.log('CLOSED MANUAL')
            }),
          ]),
        ]),
      ]),

    [],
  )

  // Case 3. Resize content or keyboard
  useCode(
    () =>
      block([
        // If the gesture is done and
        cond(neq(offset, resizeOffset), [
          // If the offset is not back to the snap bottom, animate the offset to the resize offset so we show things where we want them and away from the keyboard
          set(
            offset,
            timing({
              clock: resizeClock,
              from: offset,
              to: resizeOffset,
              duration: 3000,
            }),
          ),
          call(
            [offset, resizeOffset, keyboardHeight],
            ([offset, resizeOffset, keyboardHeight]) => {
              console.log(
                `NEQ: offset: ${offset} resizeOffset: ${resizeOffset} keyboardHeight: ${keyboardHeight}`,
              )
            },
          ),
        ]),
      ]),
    [resizeOffset],
  )

  // Keep the resizeOffset up to date based on the measured heights
  // This is effectively like a useEffect() where we the block depends on some state (keyboardHeight and textInputHeight)
  useCode(
    () =>
      block([
        set(
          resizeOffset,
          sub(
            height,
            add(
              keyboardHeight,
              textInputHeight,
              HEADER_HEIGHT,
              SEGMENT_CONTROL_HEIGHT,
            ),
          ),
        ),
      ]),
    [keyboardHeight, textInputHeight],
  )

  return (
    <>
      <PanGestureHandler {...gestureHandler}>
        <Animated.View
          style={[styles.playerSheet, { transform: [{ translateY }] }]}
        >
          <View style={{ height }}>
            <View style={{ height: HEADER_HEIGHT, backgroundColor: 'blue' }}>
              <Button
                title="plus"
                onPress={() => {
                  // Open up by 100 more
                  resizeOffset.setValue(sub(resizeOffset, 100))
                }}
              />
              <Button
                title="minus"
                onPress={() => {
                  // go down up by 100 more
                  resizeOffset.setValue(add(resizeOffset, 100))
                }}
              />
              <Button title="open" onPress={open} />
              <Button title="close" onPress={close} />
            </View>

            <Animated.View
              style={{
                backgroundColor: 'red',
                flexDirection: 'column',
                height: textInputHeightTransition,
                // Because we have flex-end
                justifyContent: 'flex-end',
                overflow: 'hidden',
              }}
            >
              <TextInput
                multiline
                ref={textInputRef}
                style={{ borderColor: 'gray', borderWidth: 1 }}
                onChangeText={(text) => onChangeText(text)}
                value={value}
                onContentSizeChange={({
                  nativeEvent: {
                    contentSize: { height },
                  },
                }) => {
                  if (textInputWithoutPadding === 0)
                    textInputWithoutPadding = height

                  if (textInputWithPadding !== 0 && textInputPadding === 0)
                    textInputPadding =
                      textInputWithPadding - textInputWithoutPadding

                  textInputHeight.setValue(
                    height + textInputPadding + SEGMENT_CONTROL_HEIGHT,
                  )
                }}
                onLayout={(layout) => {
                  if (!layout.nativeEvent.layout.height) return
                  if (textInputWithPadding === 0)
                    textInputWithPadding = layout.nativeEvent.layout.height
                }}
              />

              <View
                style={{
                  backgroundColor: 'orange',
                  height: SEGMENT_CONTROL_HEIGHT,
                }}
              />
            </Animated.View>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </>
  )
}
