import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MenuItem, CartItemOption } from '../types';
import { VegBadge } from './VegBadge';
import { Colors, Shadows } from '../constants/theme';
import { X, Check } from 'lucide-react-native';

interface CustomizationModalProps {
  visible: boolean;
  item: MenuItem | null;
  onClose: () => void;
  onConfirm: (item: MenuItem, selectedOptions: CartItemOption[]) => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  visible,
  item,
  onClose,
  onConfirm,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<CartItemOption[]>([]);

  useEffect(() => {
    if (item && Array.isArray(item.optionGroups) && item.optionGroups.length > 0) {
      // Default initial selections for required single-choice groups
      const defaults: CartItemOption[] = [];
      item.optionGroups.forEach((group) => {
        if (group.isRequired && Array.isArray(group.choices) && group.choices.length > 0) {
          defaults.push({
            groupId: group.id,
            groupName: group.groupName,
            choiceId: group.choices[0].id,
            choiceName: group.choices[0].name,
            additionalPrice: group.choices[0].additionalPrice,
          });
        }
      });
      setSelectedOptions(defaults);
    } else {
      setSelectedOptions([]);
    }
  }, [item]);

  if (!item || !Array.isArray(item.optionGroups) || item.optionGroups.length === 0) return null;

  const handleSelectOption = (
    groupId: string,
    groupName: string,
    choiceId: string,
    choiceName: string,
    additionalPrice: number,
    maxSelection: number
  ) => {
    const isSingle = maxSelection === 1;

    if (isSingle) {
      // Replace existing in that group
      const filtered = selectedOptions.filter((o) => o.groupId !== groupId);
      setSelectedOptions([
        ...filtered,
        { groupId, groupName, choiceId, choiceName, additionalPrice },
      ]);
    } else {
      // Multi-select toggle
      const exists = selectedOptions.some((o) => o.choiceId === choiceId);
      if (exists) {
        setSelectedOptions(selectedOptions.filter((o) => o.choiceId !== choiceId));
      } else {
        const groupCount = selectedOptions.filter((o) => o.groupId === groupId).length;
        if (groupCount < maxSelection) {
          setSelectedOptions([
            ...selectedOptions,
            { groupId, groupName, choiceId, choiceName, additionalPrice },
          ]);
        }
      }
    }
  };

  const additionalSum = selectedOptions.reduce((acc, curr) => acc + curr.additionalPrice, 0);
  const totalItemPrice = item.price + additionalSum;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleInfo}>
              <View style={styles.badgeRow}>
                <VegBadge isVeg={item.isVeg} size={16} />
                <Text style={styles.dishName}>{item.name}</Text>
              </View>
              <Text style={styles.basePrice}>Base: ₹{item.price}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Colors.darkText} />
            </TouchableOpacity>
          </View>

          {/* Customization Options */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {item.optionGroups.map((group) => (
              <View key={group.id} style={styles.groupSection}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>{group.groupName}</Text>
                  <Text style={styles.groupSubtitle}>
                    {group.isRequired ? 'Select 1 option' : `Optional (Up to ${group.maxSelection})`}
                  </Text>
                </View>

                {group.choices.map((choice) => {
                  const isSelected = selectedOptions.some((o) => o.choiceId === choice.id);
                  const isSingle = group.maxSelection === 1;

                  return (
                    <TouchableOpacity
                      key={choice.id}
                      style={styles.choiceRow}
                      activeOpacity={0.7}
                      onPress={() =>
                        handleSelectOption(
                          group.id,
                          group.groupName,
                          choice.id,
                          choice.name,
                          choice.additionalPrice,
                          group.maxSelection
                        )
                      }
                    >
                      <View style={styles.choiceLeft}>
                        {isSingle ? (
                          <View style={[styles.radioCircle, isSelected && styles.radioSelected]}>
                            {isSelected && <View style={styles.radioInner} />}
                          </View>
                        ) : (
                          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                            {isSelected && <Check size={12} color="#FFFFFF" />}
                          </View>
                        )}
                        <Text style={styles.choiceName}>{choice.name}</Text>
                      </View>

                      {choice.additionalPrice > 0 ? (
                        <Text style={styles.addPrice}>+₹{choice.additionalPrice}</Text>
                      ) : (
                        <Text style={styles.freePrice}>Free</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          {/* Bottom Bar with Live Total */}
          <View style={[styles.footer, Shadows.medium]}>
            <View>
              <Text style={styles.totalLabel}>Total Price</Text>
              <Text style={styles.totalValue}>₹{totalItemPrice}</Text>
            </View>

            <TouchableOpacity
              style={styles.confirmBtn}
              activeOpacity={0.85}
              onPress={() => {
                onConfirm(item, selectedOptions);
                onClose();
              }}
            >
              <Text style={styles.confirmBtnText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  titleInfo: {
    flex: 1,
    marginRight: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkText,
  },
  basePrice: {
    fontSize: 13,
    color: Colors.subText,
    marginTop: 4,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
  },
  scrollContent: {
    padding: 16,
  },
  groupSection: {
    marginBottom: 20,
  },
  groupHeader: {
    marginBottom: 10,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkText,
  },
  groupSubtitle: {
    fontSize: 12,
    color: Colors.mutedText,
    marginTop: 2,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  choiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioSelected: {
    borderColor: Colors.secondary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.secondary,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  choiceName: {
    fontSize: 14,
    color: Colors.darkText,
    fontWeight: '500',
  },
  addPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkText,
  },
  freePrice: {
    fontSize: 12,
    color: Colors.mutedText,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  totalLabel: {
    fontSize: 11,
    color: Colors.subText,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.darkText,
  },
  confirmBtn: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
