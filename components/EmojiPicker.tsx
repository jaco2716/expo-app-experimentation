import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { PropsWithChildren, useEffect } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

type Props = PropsWithChildren<{
  isVisible: boolean;
  onClose: () => void;
}>;

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function EmojiPicker({ isVisible, children, onClose }: Props) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (isVisible) translateY.value = withSpring(0);
  }, [isVisible]);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100) {
        // dismiss
        scheduleOnRN(onClose);
        translateY.value = withSpring(SCREEN_HEIGHT);
      } else {
        // snap back
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal animationType="fade" transparent visible={isVisible}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.overlay}>
          <GestureDetector gesture={pan}>
            <Animated.View style={[styles.modalContent, animatedStyle]}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Choose a sticker</Text>
                <Pressable onPress={onClose}>
                  <MaterialIcons name="close" color="#fff" size={22} />
                </Pressable>
              </View>
              <TextInput style={styles.input} />
              <View style={styles.innerContainer}>{children}</View>
            </Animated.View>
          </GestureDetector>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  input: {
    width: 200,
    height: 50,
    backgroundColor: "blue",
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#25292e",
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
  },
  innerContainer: { paddingVertical: 100 },
  titleContainer: {
    height: 50,
    backgroundColor: "#464C55",
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#fff",
    fontSize: 16,
  },
});
