import { Parent } from 'unist';
import { expect } from 'vitest';

import { treeNodeToString } from '@/features/Conversation/components/MarkdownElements/remarkPlugins/getNodeContent';

describe('treeNodeToString', () => {
  it('with latex', () => {
    const nodes = [
      {
        children: [
          {
            position: {
              end: {
                column: 7,
                line: 3,
                offset: 15,
              },
              start: {
                column: 1,
                line: 3,
                offset: 9,
              },
            },
            type: 'text',
            value: '设正向数列 ',
          },
          {
            data: {
              hChildren: [
                {
                  type: 'text',
                  value: '{ a_n }',
                },
              ],
              hName: 'code',
              hProperties: {
                className: ['language-math', 'math-inline'],
              },
            },
            position: {
              end: {
                column: 18,
                line: 3,
                offset: 26,
              },
              start: {
                column: 7,
                line: 3,
                offset: 15,
              },
            },
            type: 'inlineMath',
            value: '{ a_n }',
          },
          {
            position: {
              end: {
                column: 24,
                line: 3,
                offset: 32,
              },
              start: {
                column: 18,
                line: 3,
                offset: 26,
              },
            },
            type: 'text',
            value: ' 的首项为 ',
          },
          {
            data: {
              hChildren: [
                {
                  type: 'text',
                  value: '4',
                },
              ],
              hName: 'code',
              hProperties: {
                className: ['language-math', 'math-inline'],
              },
            },
            position: {
              end: {
                column: 29,
                line: 3,
                offset: 37,
              },
              start: {
                column: 24,
                line: 3,
                offset: 32,
              },
            },
            type: 'inlineMath',
            value: '4',
          },
          {
            position: {
              end: {
                column: 34,
                line: 3,
                offset: 42,
              },
              start: {
                column: 29,
                line: 3,
                offset: 37,
              },
            },
            type: 'text',
            value: ' ，满足 ',
          },
          {
            data: {
              hChildren: [
                {
                  type: 'text',
                  value: 'a^2_n = a_{n+1} + 3na_n - 3',
                },
              ],
              hName: 'code',
              hProperties: {
                className: ['language-math', 'math-inline'],
              },
            },
            position: {
              end: {
                column: 65,
                line: 3,
                offset: 73,
              },
              start: {
                column: 34,
                line: 3,
                offset: 42,
              },
            },
            type: 'inlineMath',
            value: 'a^2_n = a_{n+1} + 3na_n - 3',
          },
          {
            position: {
              end: {
                column: 66,
                line: 3,
                offset: 74,
              },
              start: {
                column: 65,
                line: 3,
                offset: 73,
              },
            },
            type: 'text',
            value: '.',
          },
        ],
        position: {
          end: {
            column: 66,
            line: 3,
            offset: 74,
          },
          start: {
            column: 1,
            line: 3,
            offset: 9,
          },
        },
        type: 'paragraph',
      },
      {
        children: [
          {
            checked: null,
            children: [
              {
                children: [
                  {
                    position: {
                      end: {
                        line: 5,
                        column: 7,
                        offset: 82,
                      },
                      start: {
                        line: 5,
                        column: 5,
                        offset: 80,
                      },
                    },
                    type: 'text',
                    value: '求 ',
                  },
                  {
                    data: {
                      hName: 'code',
                      hChildren: [
                        {
                          type: 'text',
                          value: 'a_2',
                        },
                      ],
                      hProperties: {
                        className: ['language-math', 'math-inline'],
                      },
                    },
                    position: {
                      end: {
                        line: 5,
                        column: 14,
                        offset: 89,
                      },
                      start: {
                        line: 5,
                        column: 7,
                        offset: 82,
                      },
                    },
                    type: 'inlineMath',
                    value: 'a_2',
                  },
                  {
                    position: {
                      end: {
                        line: 5,
                        column: 17,
                        offset: 92,
                      },
                      start: {
                        line: 5,
                        column: 14,
                        offset: 89,
                      },
                    },
                    type: 'text',
                    value: ' 和 ',
                  },
                  {
                    data: {
                      hName: 'code',
                      hChildren: [
                        {
                          type: 'text',
                          value: 'a_3',
                        },
                      ],
                      hProperties: {
                        className: ['language-math', 'math-inline'],
                      },
                    },
                    position: {
                      end: {
                        line: 5,
                        column: 24,
                        offset: 99,
                      },
                      start: {
                        line: 5,
                        column: 17,
                        offset: 92,
                      },
                    },
                    type: 'inlineMath',
                    value: 'a_3',
                  },
                  {
                    position: {
                      end: {
                        line: 5,
                        column: 43,
                        offset: 118,
                      },
                      start: {
                        line: 5,
                        column: 24,
                        offset: 99,
                      },
                    },
                    type: 'text',
                    value: '，根据前三项的规律猜想该数列的通项公式',
                  },
                ],
                position: {
                  end: {
                    column: 43,
                    line: 5,
                    offset: 118,
                  },
                  start: {
                    column: 5,
                    line: 5,
                    offset: 80,
                  },
                },
                type: 'paragraph',
              },
            ],
            position: {
              end: {
                column: 43,
                line: 5,
                offset: 118,
              },
              start: {
                column: 2,
                line: 5,
                offset: 77,
              },
            },
            spread: false,
            type: 'listItem',
          },
          {
            checked: null,
            children: [
              {
                children: [
                  {
                    position: {
                      end: {
                        line: 6,
                        column: 18,
                        offset: 136,
                      },
                      start: {
                        line: 6,
                        column: 5,
                        offset: 123,
                      },
                    },
                    type: 'text',
                    value: '用数学归纳法证明你的猜想。',
                  },
                ],
                position: {
                  end: {
                    column: 18,
                    line: 6,
                    offset: 136,
                  },
                  start: {
                    column: 5,
                    line: 6,
                    offset: 123,
                  },
                },
                type: 'paragraph',
              },
            ],
            position: {
              end: {
                column: 18,
                line: 6,
                offset: 136,
              },
              start: {
                column: 2,
                line: 6,
                offset: 120,
              },
            },
            spread: false,
            type: 'listItem',
          },
        ],
        ordered: true,
        position: {
          end: {
            column: 18,
            line: 6,
            offset: 136,
          },
          start: {
            column: 2,
            line: 5,
            offset: 77,
          },
        },
        spread: false,
        start: 1,
        type: 'list',
      },
    ];

    const result = treeNodeToString(nodes as Parent[]);

    expect(result).toEqual(`设正向数列 \${ a_n }$ 的首项为 $4$ ，满足 $a^2_n = a_{n+1} + 3na_n - 3$.

1. 求 $a_2$ 和 $a_3$，根据前三项的规律猜想该数列的通项公式
2. 用数学归纳法证明你的猜想。`);
  });

  describe('link node', () => {
    it('with url', () => {
      const nodes = [
        {
          children: [
            {
              children: [
                {
                  position: {
                    end: {
                      column: 37,
                      line: 5,
                      offset: 89,
                    },
                    start: {
                      column: 26,
                      line: 5,
                      offset: 78,
                    },
                  },
                  type: 'text',
                  value: '#citation-1',
                },
              ],
              position: {
                end: {
                  column: 50,
                  line: 5,
                  offset: 102,
                },
                start: {
                  column: 25,
                  line: 5,
                  offset: 77,
                },
              },
              title: null,
              type: 'link',
              url: 'citation-1',
            },
          ],
          position: {
            end: {
              column: 220,
              line: 5,
              offset: 272,
            },
            start: {
              column: 1,
              line: 5,
              offset: 53,
            },
          },
          type: 'paragraph',
        },
      ];

      const result = treeNodeToString(nodes as Parent[]);

      expect(result).toEqual(`[#citation-1](citation-1)`);
    });

    it('handle error case', () => {
      const nodes = [
        {
          children: [
            {
              children: [],
              position: {
                end: {
                  column: 50,
                  line: 5,
                  offset: 102,
                },
                start: {
                  column: 25,
                  line: 5,
                  offset: 77,
                },
              },
              title: null,
              type: 'link',
              url: 'citation-1',
            },
          ],
          position: {
            end: {
              column: 220,
              line: 5,
              offset: 272,
            },
            start: {
              column: 1,
              line: 5,
              offset: 53,
            },
          },
          type: 'paragraph',
        },
      ];

      const result = treeNodeToString(nodes as Parent[]);

      expect(result).toEqual(`[](citation-1)`);
    });
  });
});
