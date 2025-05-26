// src/components/ConfirmationDialog.tsx
import React from 'react';
import {
Dialog,
DialogActions,
DialogContent,
DialogTitle,
Typography,
Button
} from '@mui/material';
import { Store } from '../../types';

interface ConfirmationDialogProps {
open: boolean;
onClose: () => void;
onConfirm: () => void;
currentStore: Store | null;
nextStore: Store | null;
selectedProductCount: number;
boxCount: string;
isSaving: boolean;
}

/**
 * 次の店舗に進む前の確認ダイアログ
 * 
 * @param open ダイアログの表示状態
 * @param onClose キャンセル時のコールバック
 * @param onConfirm 確認時のコールバック
 * @param currentStore 現在の店舗情報
 * @param nextStore 次の店舗情報
 * @param selectedProductCount 選択された商品数
 * @param boxCount 入力された箱数
 * @param isSaving 保存中かどうか
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
open,
onClose,
onConfirm,
currentStore,
nextStore,
selectedProductCount,
boxCount,
isSaving
}) => {
return (
    <Dialog open={open} onClose={onClose}>
    <DialogTitle>次の店舗に進みますか？</DialogTitle>
    <DialogContent>
        <Typography variant="body1">
        {`${currentStore?.storeName || '現在の店舗'}の処理を完了し、`}
        {nextStore ? `${nextStore.storeName}に進みます。` : '最後の店舗です。'}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
        ・選択した商品数: {selectedProductCount}
        <br />
        ・設定した箱数: {boxCount || 0}
        </Typography>
    </DialogContent>
    <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
        キャンセル
        </Button>
        <Button 
        onClick={onConfirm} 
        color="primary" 
        variant="contained"
        disabled={isSaving}
        >
        {isSaving ? '保存中...' : '次へ進む'}
        </Button>
    </DialogActions>
    </Dialog>
);
};