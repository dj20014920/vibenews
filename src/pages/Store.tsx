import React from 'react';
import { useStore } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins } from 'lucide-react';

const Store: React.FC = () => {
  const { items, isLoading, isError, error, purchase, isPurchasing } = useStore();

  const renderSkeleton = () => (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="w-2/3 h-6 bg-muted rounded"></div>
        <div className="w-full h-4 bg-muted rounded mt-2"></div>
      </CardHeader>
      <CardFooter>
        <div className="w-1/4 h-8 bg-muted rounded"></div>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Point Store</h1>
      <p className="text-muted-foreground mb-8">
        Use your hard-earned points to purchase unique items and customize your profile!
      </p>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => renderSkeleton())}
        </div>
      )}

      {isError && (
        <div className="text-destructive">
          Error loading store items: {error?.message}
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items?.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <Badge variant="outline">{item.item_type.replace('_', ' ')}</Badge>
              </CardContent>
              <CardFooter>
                <Button onClick={() => purchase(item.id)} disabled={isPurchasing}>
                  <Coins className="mr-2 h-4 w-4" />
                  {isPurchasing ? 'Processing...' : `Purchase for ${item.price}`}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Store;
