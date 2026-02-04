'use client';

import { Button, Empty, List, Popconfirm, Spin, Tag, Typography } from 'antd';
import { Brain, Trash2 } from 'lucide-react';
import { memo, useEffect, useState } from 'react';

import { lambdaClient } from '@/libs/trpc/client';

const { Text, Paragraph, Title } = Typography;

interface MemoryItem {
  category: string;
  content: string;
  id: string;
  importance: number;
}

/**
 * Memory category colors
 */
const CATEGORY_COLORS: Record<string, string> = {
  communication_style: 'orange',
  context: 'default',
  fact: 'green',
  goal: 'cyan',
  interest: 'purple',
  preference: 'blue',
};

const Memory = memo(() => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch memories on mount
  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const data = await lambdaClient.userMemory.getAll.query();
        setMemories(data as MemoryItem[]);
      } catch (error) {
        console.error('Failed to fetch memories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMemories();
  }, []);

  // Delete memory handler
  const handleDelete = async (id: string) => {
    try {
      await lambdaClient.userMemory.delete.mutate(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error('Failed to delete memory:', error);
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ alignItems: 'center', display: 'flex', gap: 8, marginBottom: 16 }}>
        <Brain size={20} />
        <Title level={5} style={{ margin: 0 }}>
          User Memory
        </Title>
      </div>

      <Text style={{ display: 'block', marginBottom: 16 }} type="secondary">
        Phở Chat sẽ tự động học và nhớ thông tin quan trọng từ các cuộc trò chuyện của bạn.
      </Text>

      <div
        style={{
          background: 'var(--lobe-color-bg-container)',
          border: '1px solid var(--lobe-color-border)',
          borderRadius: 8,
          maxHeight: 400,
          overflow: 'auto',
          padding: 16,
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <Spin />
          </div>
        ) : memories.length === 0 ? (
          <Empty
            description="Chưa có memory nào. Hệ thống sẽ tự động học từ các cuộc hội thoại."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={memories}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Popconfirm
                    key="delete"
                    onConfirm={() => handleDelete(item.id)}
                    title="Xóa memory này?"
                  >
                    <Button danger icon={<Trash2 size={14} />} size="small" type="text" />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  description={
                    <Paragraph ellipsis={{ expandable: true, rows: 2 }} style={{ marginBottom: 0 }}>
                      {item.content}
                    </Paragraph>
                  }
                  title={
                    <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
                      <Tag color={CATEGORY_COLORS[item.category] || 'default'}>{item.category}</Tag>
                      <Text style={{ fontSize: 12 }} type="secondary">
                        Importance: {item.importance}/10
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
            size="small"
          />
        )}
      </div>
    </div>
  );
});

Memory.displayName = 'MemorySettings';

export default Memory;
