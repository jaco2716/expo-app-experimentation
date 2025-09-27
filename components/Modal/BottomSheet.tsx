import { PropsWithChildren, useEffect, useState } from "react";
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

type Props = PropsWithChildren<{
  isVisible: boolean;
  isScrollable?: boolean;
  onClose: () => void;
  innerStyle?: StyleProp<ViewStyle>;
}>;

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function BottomSheet({
  isVisible,
  isScrollable,
  onClose,
  children,
  innerStyle,
}: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const translateY = useSharedValue(0);
  const keyboardOffset = useSharedValue(0);

  const [kOffset, setKOffset] = useState(0);

  const innerStyles = [styles.innerContainer, innerStyle];

  useEffect(() => {
    if (isVisible) translateY.value = withSpring(0);
  }, [isVisible]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        keyboardOffset.value = e.endCoordinates.height;
        setKOffset(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        keyboardOffset.value = 0;
        setKOffset(0);
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 200) {
        // dismiss
        scheduleOnRN(onClose);
        translateY.value = withSpring(SCREEN_HEIGHT);
      } else {
        // snap back
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: translateY.value,
      },
    ],
    // maxHeight:
    //   SCREEN_HEIGHT -
    //   keyboardOffset.value -
    //   // (keyboardOffset.value ? 0 : bottom) -
    //   top -
    //   50,
  }));

  const maxHeight =
    SCREEN_HEIGHT -
    50 -
    kOffset -
    (Platform.OS === "ios" ? 0 : kOffset ? 0 : bottom);

  console.log(
    "maxHeight",
    maxHeight,
    Platform.OS === "ios" ? 0 : kOffset ? 0 : bottom,
    top
  );

  const InnerView = isScrollable ? ScrollView : View;

  return (
    <Modal animationType="fade" transparent visible={isVisible}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.container}>
            <Pressable style={styles.backdrop} onPress={onClose} />
            <GestureDetector gesture={pan}>
              <Animated.View
                style={[styles.modalContent, animatedStyle, { maxHeight }]}
              >
                <View style={styles.handle} />
                {isScrollable ? (
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    automaticallyAdjustKeyboardInsets
                    contentContainerStyle={innerStyles}
                  >
                    {children}
                  </ScrollView>
                ) : (
                  <View style={innerStyles}>{children}</View>
                )}
              </Animated.View>
            </GestureDetector>
          </View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  handle: {
    height: 4,
    width: 25,
    borderRadius: 4,
    marginVertical: 8,
    backgroundColor: "#ccc",
    alignSelf: "center",
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#25292e",
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
    alignSelf: "flex-end",
  },
  innerContainer: { paddingVertical: 25 },
});
