// 9x9 Sudoku grid container
// Props-driven: works for both the main game and technique practice.
// The game screen passes data via the useGameBoardProps() hook.
// The technique screen passes data directly from puzzle state.

import React, { useCallback, useRef, useMemo, memo } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SudokuCell, CELL_SIZE, COMPACT_CELL_SIZE } from './SudokuCell';
import { colors } from '../../theme/colors';
import { startGameAnimations } from '../../theme/animations';
import { BOARD_SIZE, Position, positionKey, CellAnimationState } from '../../engine/types';


export interface SudokuCellData {
  value: number | null;
  isGiven: boolean;
  isValid: boolean;
  notes: Set<number>;
}

export interface SudokuBoardProps {
  /** 9x9 grid of cell data */
  cells: SudokuCellData[][];
  /** Currently selected cell position */
  selectedCell?: Position | null;
  /** Primary highlight set (orange) — technique pattern cells or game number-highlights */
  highlightedCells?: Set<string>;
  /** Secondary highlight set (coral) — elimination target cells in technique practice */
  secondaryHighlightedCells?: Set<string>;
  /** Related cells (row/col/box peers of selected cell) */
  relatedCells?: Set<string>;
  /** Number-based highlighting: all cells with this value get highlighted */
  highlightedNumber?: number | null;
  /** Cell press handler */
  onCellPress?: (row: number, col: number) => void;
  /** Whether cells are interactive (pressable) */
  interactive?: boolean;
  /** Animate board entrance with fade-in */
  animateEntrance?: boolean;
  /** Animate cell values with pop/shake/glow (game mode) */
  animateValues?: boolean;
  /** Use smaller cell size for technique practice */
  compact?: boolean;
  /** Show checkerboard box tinting */
  showBoxTinting?: boolean;
  /** @deprecated Use boardAnimationStore + useBoardAnimationsForCell in SudokuCell instead */
  activeAnimations?: Map<string, CellAnimationState[]>;
}

/** Boxes 1, 3, 5, 7 get alt background (checkerboard pattern) */
const isAltBox = (boxIndex: number): boolean => boxIndex % 2 === 1;

const clamp = (min: number, max: number, v: number) =>
  Math.max(min, Math.min(max, v));

const DRAG_THRESHOLD = 3;

export const SudokuBoard = memo(({
  cells,
  selectedCell,
  highlightedCells,
  secondaryHighlightedCells,
  relatedCells,
  highlightedNumber,
  onCellPress,
  interactive = true,
  animateEntrance = false,
  animateValues = true,
  compact = false,
  showBoxTinting = true,
  activeAnimations: _activeAnimations, // deprecated, cells use useBoardAnimationsForCell
}: SudokuBoardProps) => {
  const cellSize = compact ? COMPACT_CELL_SIZE : CELL_SIZE;
  const dragEnabled = interactive && !!onCellPress;

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      onCellPress?.(row, col);
    },
    [onCellPress],
  );

  // --- Drag-to-select refs ---
  const onCellPressRef = useRef(onCellPress);
  onCellPressRef.current = onCellPress;
  const cellSizeRef = useRef(cellSize);
  cellSizeRef.current = cellSize;
  const lastDragCellRef = useRef<{ row: number; col: number } | null>(null);
  const boardOriginRef = useRef({ x: 0, y: 0 });
  const wrapperRef = useRef<View>(null);

  const hitTest = useCallback((pageX: number, pageY: number) => {
    const relX = pageX - boardOriginRef.current.x;
    const relY = pageY - boardOriginRef.current.y;
    return {
      row: clamp(0, 8, Math.floor(relY / cellSizeRef.current)),
      col: clamp(0, 8, Math.floor(relX / cellSizeRef.current)),
    };
  }, []);

  const selectIfChanged = useCallback((pageX: number, pageY: number) => {
    const { row, col } = hitTest(pageX, pageY);
    const prev = lastDragCellRef.current;
    if (prev && prev.row === row && prev.col === col) return;
    lastDragCellRef.current = { row, col };
    onCellPressRef.current?.(row, col);
  }, [hitTest]);

  const remeasureAndSelect = useCallback((pageX: number, pageY: number) => {
    wrapperRef.current?.measure((_x, _y, _w, _h, pX, pY) => {
      boardOriginRef.current = { x: pX, y: pY };
      selectIfChanged(pageX, pageY);
    });
  }, [selectIfChanged]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > DRAG_THRESHOLD || Math.abs(g.dy) > DRAG_THRESHOLD,
        onPanResponderGrant: (evt) => {
          remeasureAndSelect(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        },
        onPanResponderMove: (evt) => {
          selectIfChanged(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        },
        onPanResponderRelease: () => {
          lastDragCellRef.current = null;
        },
        onPanResponderTerminate: () => {
          lastDragCellRef.current = null;
        },
      }),
    [selectIfChanged, remeasureAndSelect],
  );

  const handleLayout = useCallback(() => {
    wrapperRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      boardOriginRef.current = { x: pageX, y: pageY };
    });
  }, []);

  // --- Grid rendering ---
  const gridContent = (
    <View style={styles.board}>
      {Array.from({ length: BOARD_SIZE }, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: BOARD_SIZE }, (_, col) => {
            const cellData = cells[row][col];
            const key = positionKey({ row, col });

            const isSelected =
              selectedCell?.row === row && selectedCell?.col === col;
            const isRelated = relatedCells?.has(key) ?? false;
            const isPrimaryHighlight = highlightedCells?.has(key) ?? false;
            const isSecondaryHighlight =
              secondaryHighlightedCells?.has(key) ?? false;
            const isNumberHighlighted =
              highlightedNumber != null &&
              cellData.value === highlightedNumber;
            const isHighlighted = isPrimaryHighlight || isNumberHighlighted;

            const boxRow = Math.floor(row / 3);
            const boxCol = Math.floor(col / 3);
            const boxIndex = boxRow * 3 + boxCol;
            const isInAltBox = showBoxTinting && isAltBox(boxIndex);

            const cellDelay =
              (row + col) * startGameAnimations.cellCascade.delayPerCell;

            const cellContent = (
              <SudokuCell
                key={`${row}-${col}`}
                row={row}
                col={col}
                value={cellData.value}
                isGiven={cellData.isGiven}
                isValid={cellData.isValid}
                notes={cellData.notes}
                isSelected={isSelected}
                isRelated={isRelated}
                isHighlighted={isHighlighted}
                isSecondaryHighlight={isSecondaryHighlight}
                isInAltBox={isInAltBox}
                onPress={interactive ? handleCellPress : undefined}
                animateValues={animateValues}
                compact={compact}
              />
            );

            if (animateEntrance) {
              return (
                <Animated.View
                  key={`${row}-${col}`}
                  entering={FadeIn.delay(cellDelay).duration(
                    startGameAnimations.cellCascade.duration,
                  )}
                >
                  {cellContent}
                </Animated.View>
              );
            }

            return cellContent;
          })}
        </View>
      ))}
    </View>
  );

  return (
    <Animated.View
      entering={
        animateEntrance
          ? FadeIn.duration(startGameAnimations.boardContainerFadeIn.duration)
          : undefined
      }
      style={styles.container}
    >
      <View style={styles.cardOuter}>
        <View style={compact ? styles.cardCompact : styles.card}>
          {dragEnabled ? (
            <View
              ref={wrapperRef}
              onLayout={handleLayout}
              style={{ width: 9 * cellSize, height: 9 * cellSize }}
              {...panResponder.panHandlers}
            >
              {gridContent}
            </View>
          ) : (
            gridContent
          )}
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
  },
  cardOuter: {
    borderWidth: 1,
    borderColor: colors.gridLineBold,
  },
  card: {
    backgroundColor: colors.boardBackground,
  },
  cardCompact: {
    backgroundColor: colors.boardBackground,
    borderWidth: 2,
    borderColor: colors.boxBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  board: {
    overflow: 'visible',
  },
  row: {
    flexDirection: 'row',
  },
});
