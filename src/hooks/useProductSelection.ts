import { useState } from 'react';
import { Product } from '../types';

/**
 * 商品選択と入力値管理を行うカスタムフック
 * 
 * 商品の選択状態、入力値、確認ダイアログなどの状態を管理します
 */
export function useProductSelection() {
// 商品選択と入力関連の状態
const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
const [inputValue, setInputValue] = useState<string>('');
const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
const [savingData, setSavingData] = useState<boolean>(false);
const [checkError, setCheckError] = useState<string | null>(null);

/**
 * 商品の選択/選択解除を切り替える
 * @param productId 選択/選択解除する商品ID
 */
const handleProductSelect = (productId: string) => {
    setSelectedProductIds(prev => {
    // すでに選択されている場合は削除、そうでなければ追加
    if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
    } else {
        return [...prev, productId];
    }
    });
};

/**
 * テンキーからの入力値を更新する
 * @param value 新しい入力値
 */
const handleInputChange = (value: string) => {
    setInputValue(value);
};

/**
 * 選択状態と入力値をリセットする
 */
const resetSelection = () => {
    setSelectedProductIds([]);
    setInputValue('');
};

/**
 * 選択された商品の数量を更新する
 * @param products 全商品リスト
 * @param setProducts 商品リスト更新関数
 * @param setError エラー設定関数
 * @returns 更新が成功したかどうか
 */
const updateSelectedProductsQuantity = (
    products: Product[],
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>
): boolean => {
    if (selectedProductIds.length === 0 || !inputValue) {
    setError('商品を選択して箱数を入力してください');
    return false;
    }
    
    const quantity = parseInt(inputValue, 10);
    if (isNaN(quantity)) return false;

    // すべての商品がチェックされているか確認
    const uncheckedProducts = products.filter(p => !p.isChecked && !selectedProductIds.includes(p.id));
    if (uncheckedProducts.length > 0) {
    setError(`${uncheckedProducts.length}個の商品がチェックされていません。すべての商品をチェックしてください。`);
    return false;
    }

    // 選択されている全ての商品の数量を更新
    setProducts(prevProducts => 
    prevProducts.map(product => 
        selectedProductIds.includes(product.id) 
        ? { ...product, quantity, isChecked: true } 
        : product
    )
    );  

    return true;
};

return {
    selectedProductIds,
    setSelectedProductIds,
    inputValue,
    setInputValue,
    showConfirmDialog,
    setShowConfirmDialog,
    savingData,
    setSavingData,
    checkError,
    setCheckError,
    handleProductSelect,
    handleInputChange,
    resetSelection,
    updateSelectedProductsQuantity
};
}