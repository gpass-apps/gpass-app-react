import { useEffect, useState } from 'react';
import { getDocs, Timestamp, query as q, collection as col, QueryConstraint, getFirestore } from 'firebase/firestore';
import dayjs from 'dayjs';

export interface PropsUseCollection {
  collection: string;
  query: QueryConstraint[];
  extraPropsByItemArray?: Record<string, any>;
  formatDate?: string;
  wait?: boolean;
  initLoading?: boolean;
  mergeResponse?: boolean;
}

const useCollection = <T extends { id?: string; }>({ collection, query, extraPropsByItemArray, formatDate, wait, initLoading = true, mergeResponse }: PropsUseCollection) => {
  const [loading, setLoading] = useState<boolean>(initLoading);
  const [data, setData] = useState<Array<T>>([]);
  const [error, setError] = useState<unknown>();
  const [notLoadMore, setNotLoadMore] = useState(false);

  useEffect(() => {
    if (!collection) {
      setData([]);
      setNotLoadMore(false);

      return;
    }

    if (wait || notLoadMore) return;

    const init = async () => {
      try {
        setLoading(true);

        const _snapshot = await getDocs(q(col(getFirestore(), collection), ...query));

        if (!_snapshot.docs.length) {
          setNotLoadMore(true);
        }

        setData(prev => {
          const newData = _snapshot.docs.map(d => {
            let dataDoc = d.data();

            Object.keys(dataDoc).forEach(key => {
              if (dataDoc[key] instanceof Timestamp) {
                const date = dataDoc[key].toDate();
                dataDoc[key] = date;

                if (formatDate) {
                  dataDoc[key + "Formated"] = dayjs(date).format(formatDate);
                }
              }
            });

            if (extraPropsByItemArray) {
              dataDoc = {
                ...dataDoc,
                ...extraPropsByItemArray
              };
            }

            return { ...dataDoc, id: d.id } as unknown as T;
          }) as Array<T>;

          if (mergeResponse) {
            return [...prev, ...newData];
          }

          return newData;
        });
      } catch (error) {
        console.error(error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [query, extraPropsByItemArray, formatDate, collection, wait, notLoadMore, mergeResponse]);

  return { loading, data, setData, error };
};

export default useCollection;