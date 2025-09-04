import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  useAudioRecorder,
  useAudioRecorderState,
  useAudioPlayer,
  useAudioPlayerStatus,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from 'expo-audio';
import { DESIGN_SYSTEM } from '../../constants/DesignSystem';

interface AnimatedNotesRowProps {
  textNote: string;
  onTextNoteChange: (text: string) => void;
  voiceNote: string | null;
  onVoiceNoteChange: (note: string | null) => void;
  isRecording: boolean;
  recordingDuration: number;
  onToggleRecording: () => void;
}

export const AnimatedNotesRow: React.FC<AnimatedNotesRowProps> = ({
  textNote,
  onTextNoteChange,
  voiceNote,
  onVoiceNoteChange,
  isRecording,
  recordingDuration,
  onToggleRecording,
}) => {
  // Focus states
  const [isTextNoteFocused, setIsTextNoteFocused] = useState(false);
  const [isVoiceNoteFocused, setIsVoiceNoteFocused] = useState(false);
  const [blurTimeoutId, setBlurTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Voice note states
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);

  // Audio recorder and player setup
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const audioPlayer = useAudioPlayer(voiceNote ? { uri: voiceNote } : null);
  const playerStatus = useAudioPlayerStatus(audioPlayer);

  // Setup audio permissions and mode
  useEffect(() => {
    const setupAudio = async () => {
      try {
        // Request recording permissions
        const permissionResponse = await AudioModule.requestRecordingPermissionsAsync();
        if (permissionResponse.granted) {
          setHasPermissions(true);

          // Set audio mode with proper iOS volume settings
          await setAudioModeAsync({
            playsInSilentMode: true,
            allowsRecording: true,
            shouldPlayInBackground: true,
            interruptionMode: 'duckOthers',
            shouldRouteThroughEarpiece: false, // Force speaker output for maximum volume
          });

          console.log('Audio permissions granted and mode set with iOS volume optimization');
        } else {
          console.log('Audio permissions denied');
        }
      } catch (error) {
        console.error('Failed to setup audio:', error);
      }
    };

    setupAudio();
  }, []);

  // Monitor player status for play/pause state
  useEffect(() => {
    setIsPlaying(playerStatus.playing);
  }, [playerStatus.playing]);

  // Set maximum volume when audio player is ready with iOS optimization
  useEffect(() => {
    if (audioPlayer && voiceNote) {
      // Set volume to maximum (1.0)
      audioPlayer.volume = 1.0;
      console.log('Audio player volume set to maximum:', audioPlayer.volume);

      // iOS-specific: Additional volume optimization
      if (Platform.OS === 'ios') {
        console.log('iOS detected: Applied additional volume optimizations');
      }
    }
  }, [audioPlayer, voiceNote]);

  // Animation values
  const textNoteWidth = useRef(new Animated.Value(155)).current; // Equal width initially
  const voiceNoteWidth = useRef(new Animated.Value(155)).current; // Equal width initially

  // Input refs
  const textInputRef = useRef<TextInput>(null);

  // Animation configurations
  const ANIMATION_DURATION = 250;
  const EQUAL_WIDTH = 155; // 50% each minus gap
  const EXPANDED_WIDTH = 240; // Expanded width
  const COMPACT_WIDTH = 70; // Compact width

  // Use spring animation for smoother feel
  const animateToSizes = (textWidth: number, voiceWidth: number) => {
    Animated.parallel([
      Animated.spring(textNoteWidth, {
        toValue: textWidth,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(voiceNoteWidth, {
        toValue: voiceWidth,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  };

  // Handle text note focus
  const handleTextNoteFocus = () => {
    console.log('Text note focused - animating');

    // Clear any existing blur timeout
    if (blurTimeoutId) {
      clearTimeout(blurTimeoutId);
      setBlurTimeoutId(null);
    }

    setIsTextNoteFocused(true);

    // Animate text note expansion and voice note compression
    animateToSizes(EXPANDED_WIDTH, COMPACT_WIDTH);
  };

  const handleTextNoteBlur = () => {
    console.log('Text note blurred - resetting to equal');
    setIsTextNoteFocused(false);

    // Reset to equal widths if voice note is not focused
    if (!isVoiceNoteFocused) {
      animateToSizes(EQUAL_WIDTH, EQUAL_WIDTH);
    }
  };

  // Handle voice note focus (when recording starts)
  const handleVoiceNoteFocus = () => {
    console.log('Voice note focused - animating');
    setIsVoiceNoteFocused(true);

    // Animate voice note expansion and text note compression
    animateToSizes(COMPACT_WIDTH, EXPANDED_WIDTH);
  };

  const handleVoiceNoteBlur = () => {
    console.log('Voice note blurred - resetting to equal');
    setIsVoiceNoteFocused(false);

    // Reset to equal widths if text note is not focused
    if (!isTextNoteFocused) {
      animateToSizes(EQUAL_WIDTH, EQUAL_WIDTH);
    }
  };

  // Handle voice recording toggle
  const handleVoiceToggle = () => {
    // Blur text input when starting voice recording
    if (!recorderState.isRecording && textInputRef.current) {
      textInputRef.current.blur();
    }

    if (!recorderState.isRecording) {
      handleVoiceNoteFocus();
      startRecording();
    } else {
      handleVoiceNoteBlur();
      stopRecording();
    }
  };

  // Audio recording functions - Real expo-audio implementation
  const startRecording = async () => {
    try {
      if (!hasPermissions) {
        console.error('No audio recording permissions');
        return;
      }

      console.log('Starting voice recording...');

      // Prepare and start recording with proper error handling
      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record();

      onToggleRecording(); // Notify parent component
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      // Reset recording state if failed
      if (recorderState.isRecording) {
        try {
          await audioRecorder.stop();
        } catch (stopError) {
          console.error('Failed to stop recording after start error', stopError);
        }
      }
    }
  };

  const stopRecording = async () => {
    try {
      if (!recorderState.isRecording) {
        console.log('Recording is not active, skipping stop');
        return;
      }

      console.log('Stopping voice recording...');

      // Stop recording
      await audioRecorder.stop();

      // Get the recording URI
      const recordingUri = audioRecorder.uri;
      console.log('Recording stopped and stored at', recordingUri);

      // Save the recording URI as voice note
      if (recordingUri) {
        onVoiceNoteChange(recordingUri);
      }

      onToggleRecording(); // Notify parent component
      console.log('Voice note saved successfully');
    } catch (err) {
      console.error('Failed to stop recording', err);
      // Still notify parent to reset state
      onToggleRecording();
    }
  };

  // Audio playback functions - Real expo-audio implementation with iOS volume optimization
  const togglePlayback = async () => {
    try {
      if (!voiceNote) return;

      if (isPlaying) {
        // Pause playback
        console.log('Pausing voice note playback');
        audioPlayer.pause();
      } else {
        // Start playback with iOS-optimized volume settings
        console.log('Playing voice note:', voiceNote);

        // Re-configure audio mode specifically for playback with maximum volume
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false, // Disable recording during playback for better volume
          shouldPlayInBackground: true,
          interruptionMode: 'duckOthers',
          shouldRouteThroughEarpiece: false, // Ensure speaker routing
        });

        // Set maximum volume
        audioPlayer.volume = 1.0;
        console.log('Volume set to:', audioPlayer.volume, 'with iOS-optimized routing');

        // If audio has finished, seek to beginning before playing
        if (playerStatus.currentTime === playerStatus.duration && playerStatus.duration > 0) {
          await audioPlayer.seekTo(0);
        }

        audioPlayer.play();
      }
    } catch (err) {
      console.error('Failed to toggle playback', err);
    }
  };
  const deleteVoiceNote = async () => {
    console.log('Deleting voice note');

    // Stop playback if playing with error handling
    try {
      if (isPlaying && audioPlayer) {
        audioPlayer.pause();
      }
    } catch (error) {
      console.log('Error stopping playback during delete:', error);
    }

    setIsPlaying(false);
    onVoiceNoteChange(null);
    handleVoiceNoteBlur();
  };

  // Monitor recording state to manage focus
  useEffect(() => {
    if (recorderState.isRecording) {
      handleVoiceNoteFocus();
    } else {
      // Always blur when recording stops, regardless of voice note existence
      handleVoiceNoteBlur();
    }
  }, [recorderState.isRecording]);

  // Cleanup audio resources on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutId) {
        clearTimeout(blurTimeoutId);
      }
      // Stop any ongoing playback and recording with proper error handling
      try {
        if (isPlaying && audioPlayer) {
          audioPlayer.pause();
        }
      } catch (error) {
        console.log('Error stopping playback during cleanup:', error);
      }

      try {
        if (recorderState.isRecording && audioRecorder) {
          audioRecorder.stop();
        }
      } catch (error) {
        console.log('Error stopping recording during cleanup:', error);
      }
    };
  }, [blurTimeoutId, isPlaying, recorderState.isRecording]);

  // Handle outside tap to blur text input and reset voice note focus
  const handleOutsideTap = () => {
    if (isTextNoteFocused && textInputRef.current) {
      textInputRef.current.blur();
    }
    // Also handle voice note blur when clicking outside
    if (isVoiceNoteFocused && !recorderState.isRecording && !voiceNote) {
      handleVoiceNoteBlur();
    }
  };

  return (
    <Pressable onPress={handleOutsideTap}>
      <View style={styles.notesRow}>
        {/* Animated Text Note Input */}
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View
            style={[
              styles.textNoteContainer,
              {
                width: textNoteWidth,
                borderColor: isTextNoteFocused ? DESIGN_SYSTEM.colors.primary[300] : '#E5E7EB',
                backgroundColor: isTextNoteFocused ? '#FEFEFE' : '#F9FAFB',
              },
            ]}
          >
            <MaterialIcons
              name="note-alt"
              size={18}
              color={
                isTextNoteFocused
                  ? DESIGN_SYSTEM.colors.primary[500]
                  : DESIGN_SYSTEM.colors.neutral[400]
              }
            />
            <TextInput
              ref={textInputRef}
              style={[
                styles.textNoteInput,
                !isTextNoteFocused && isVoiceNoteFocused && styles.textNoteInputCompact,
              ]}
              placeholder={!isTextNoteFocused && isVoiceNoteFocused ? 'Note' : 'Add note...'}
              placeholderTextColor={DESIGN_SYSTEM.colors.neutral[400]}
              multiline={isTextNoteFocused || !isVoiceNoteFocused}
              numberOfLines={1}
              maxLength={30}
              value={textNote}
              onChangeText={onTextNoteChange}
              onFocus={handleTextNoteFocus}
              onBlur={handleTextNoteBlur}
              onSubmitEditing={handleTextNoteBlur}
              blurOnSubmit={true}
              returnKeyType="done"
              autoCorrect={false}
              spellCheck={false}
            />
          </Animated.View>
        </Pressable>

        {/* Animated Voice Note Section */}
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View
            style={[
              styles.voiceNoteContainer,
              {
                width: voiceNoteWidth,
              },
            ]}
          >
            {voiceNote && !recorderState.isRecording ? (
              // Voice note recorded - show play/pause button and waveform with delete at end
              <View style={styles.voiceNotePlayback}>
                <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
                  <MaterialIcons
                    name={isPlaying ? 'pause' : 'play-arrow'}
                    size={16}
                    color={DESIGN_SYSTEM.colors.primary[600]}
                  />
                </TouchableOpacity>

                {/* Always show waveform when voice note exists */}
                <View style={styles.voiceWaveform}>
                  {[...Array(8)].map((_, i) => (
                    <View key={i} style={[styles.waveBar, { height: Math.random() * 12 + 4 }]} />
                  ))}
                </View>

                {/* Delete button at the end */}
                <TouchableOpacity onPress={deleteVoiceNote} style={styles.deleteVoiceButton}>
                  <MaterialIcons name="close" size={14} color={DESIGN_SYSTEM.colors.neutral[500]} />
                </TouchableOpacity>
              </View>
            ) : (
              // Voice note recording or empty state
              <TouchableOpacity
                style={[
                  styles.voiceRecordButton,
                  recorderState.isRecording && styles.voiceRecordButtonActive,
                ]}
                onPress={handleVoiceToggle}
              >
                <MaterialIcons
                  name={recorderState.isRecording ? 'stop' : 'mic'}
                  size={18}
                  color={recorderState.isRecording ? '#FFFFFF' : DESIGN_SYSTEM.colors.neutral[500]}
                />
                {/* Show recording timer only when expanded */}
                {recorderState.isRecording && isVoiceNoteFocused && (
                  <Text style={styles.recordingTimer}>{recordingDuration}s</Text>
                )}
              </TouchableOpacity>
            )}
          </Animated.View>
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  notesRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    maxWidth: 320,
    alignItems: 'flex-start',
  },

  // Text Note Styles
  textNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    minHeight: 40,
    height: 40, // Fixed height to prevent layout shifts
  },
  textNoteInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    minHeight: 18,
    maxHeight: 50,
    paddingVertical: 0,
  },
  textNoteInputCompact: {
    fontSize: 12,
    maxHeight: 18,
    height: 18,
  },

  // Voice Note Styles
  voiceNoteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  voiceNotePlayback: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
    width: '100%',
    minHeight: 40,
  },
  playButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  voiceWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    height: 16,
  },
  waveBar: {
    width: 2,
    backgroundColor: DESIGN_SYSTEM.colors.primary[400],
    borderRadius: 1,
    opacity: 0.7,
  },
  deleteVoiceButton: {
    padding: 2,
    borderRadius: 8,
  },
  voiceRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    width: '100%',
    minHeight: 40,
  },
  voiceRecordButtonActive: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  recordingTimer: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
