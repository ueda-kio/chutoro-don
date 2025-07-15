'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { SongsData, GameMode } from '@/types';
import { loadSongsData } from '@/utils/quiz';
import { AlbumSelectorModal } from '@/components/Modal';

export default function HomePage() {
  const router = useRouter();
  const [songsData, setSongsData] = useState<SongsData | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultPlayDuration, setDefaultPlayDuration] = useState<number | null>(null);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await loadSongsData();
        setSongsData(data);
        // デフォルトで最初のアーティストを選択
        if (data.artists.length > 0) {
          const firstArtist = data.artists[0];
          setSelectedArtistId(firstArtist.id);
          // 最初のアーティストの全アルバムを選択
          setSelectedAlbumIds(firstArtist.albums.map((album) => album.id));
        }
      } catch (error) {
        console.error('Failed to load songs data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleArtistChange = (artistId: string) => {
    setSelectedArtistId(artistId);
    setSelectedAlbumIds([]); // アーティスト変更時はアルバム選択をリセット
  };

  const handleAlbumToggle = (albumId: string) => {
    setSelectedAlbumIds((prev) => (prev.includes(albumId) ? prev.filter((id) => id !== albumId) : [...prev, albumId]));
  };

  const handleSelectAll = () => {
    const selectedArtist = songsData?.artists.find((artist) => artist.id === selectedArtistId);
    if (selectedArtist) {
      setSelectedAlbumIds(selectedArtist.albums.map((album) => album.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedAlbumIds([]);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode);
  };

  const handleStartQuiz = () => {
    if (!selectedMode) {
      alert('プレイモードを選択してください。');
      return;
    }

    if (selectedAlbumIds.length === 0) {
      alert('アルバムを1つ以上選択してください。');
      return;
    }

    // 全アルバム数を取得
    const totalAlbums = songsData?.artists.reduce((count, artist) => count + artist.albums.length, 0) || 0;

    // URLパラメータを構築
    const params = new URLSearchParams();
    
    // ゲームモードのパラメータ
    params.set('mode', selectedMode);
    
    // アルバム選択のパラメータ
    if (selectedAlbumIds.length !== totalAlbums) {
      params.set('albums', selectedAlbumIds.join(','));
    }
    
    // デフォルト再生時間のパラメータ
    if (defaultPlayDuration !== null) {
      params.set('defaultDuration', defaultPlayDuration.toString());
    }
    
    // クイズ画面に遷移
    const queryString = params.toString();
    
    if (selectedMode === 'challenge') {
      router.push(`/challenge${queryString ? `?${queryString}` : ''}`);
    } else {
      router.push(`/quiz${queryString ? `?${queryString}` : ''}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">データを読み込み中...</div>
      </div>
    );
  }

  if (!songsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">データの読み込みに失敗しました</div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* タイトル */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">中トロドン</h1>
          <p className="text-2xl text-gray-600 mb-4">曲の中トロを聴いて曲名を当てよう</p>
        </div>

        {/* プレイモード選択エリア */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">プレイモード</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* のんびりモード */}
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: カード型UIのため、divでの実装を選択 */}
            <div
              onClick={() => handleModeSelect('freeplay')}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                selectedMode === 'freeplay'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center mb-4">
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  selectedMode === 'freeplay' ? 'bg-primary-600' : 'bg-gray-300'
                }`} />
                <h3 className="text-xl font-semibold text-gray-900">のんびりモード</h3>
              </div>
              <p className="text-gray-600 mb-4">
                答えを表示してゆっくり楽しめる従来のクイズスタイル
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• 答えを表示してゆっくり楽しめる</li>
                <li>• 問題数は自由に選択可能</li>
                <li>• 時間制限なし</li>
              </ul>
            </div>

            {/* タイムアタック */}
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: カード型UIのため、divでの実装を選択 */}
            <div
              onClick={() => handleModeSelect('challenge')}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                selectedMode === 'challenge'
                  ? 'border-red-600 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center mb-4">
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  selectedMode === 'challenge' ? 'bg-red-600' : 'bg-gray-300'
                }`} />
                <h3 className="text-xl font-semibold text-gray-900">タイムアタック</h3>
              </div>
              <p className="text-gray-600 mb-4">
                テキスト入力で回答し、時間とアクションでスコアを競う
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• 全10問固定</li>
                <li>• テキスト入力で回答</li>
                <li>• スコアシステム搭載</li>
                <li>• 時間と再生時間でボーナス</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 出題範囲設定エリア */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">出題範囲</h2>
            <button
              type="button"
              onClick={handleOpenModal}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium transition-colors"
            >
              出題範囲を設定
            </button>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              {selectedAlbumIds.length > 0 
                ? `${selectedAlbumIds.length}個のアルバムが選択されています` 
                : '出題範囲を設定してください'}
            </p>
            {selectedAlbumIds.length === 0 && (
              <p className="text-sm text-gray-500">
                「出題範囲を設定」ボタンをクリックして、アルバムを選択してください
              </p>
            )}
          </div>
        </div>

        {/* クイズ開始ボタン */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleStartQuiz}
            disabled={selectedAlbumIds.length === 0 || !selectedMode}
            className={`px-16 py-6 text-2xl font-bold rounded-lg transform transition hover:scale-105 shadow-lg ${
              selectedAlbumIds.length === 0 || !selectedMode
                ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                : selectedMode === 'challenge' 
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            {selectedMode === 'challenge' ? 'タイムアタック開始' : 'クイズ開始'}
          </button>
          {(selectedAlbumIds.length === 0 || !selectedMode) && (
            <p className="text-sm text-gray-500 mt-2">
              {!selectedMode ? 'プレイモードを選択してください' : '出題範囲を設定してください'}
            </p>
          )}
        </div>

        {/* 出題範囲設定モーダル */}
        {songsData && (
          <AlbumSelectorModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            artists={songsData.artists}
            selectedArtistId={selectedArtistId}
            selectedAlbumIds={selectedAlbumIds}
            onArtistChange={handleArtistChange}
            onAlbumToggle={handleAlbumToggle}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            defaultPlayDuration={defaultPlayDuration}
            onDefaultPlayDurationChange={setDefaultPlayDuration}
          />
        )}
      </div>
    </div>
  );
}
