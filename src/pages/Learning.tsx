import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Play, CheckCircle, Clock, TrendingUp, Star, Users } from 'lucide-react'

interface LearningPath {
  id: string
  title: string
  description: string
  technology: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedHours: number
  totalSteps: number
  completedSteps: number
  progress: number
  isEnrolled: boolean
  tags: string[]
  instructor: string
  rating: number
  students: number
}

// 실제 학습 경로를 데이터베이스에서 가져오는 로직 구현 예정
// 현재는 샘플 데이터 사용
const samplePaths: LearningPath[] = [
  {
    id: '1',
    title: 'Cursor로 시작하는 AI 코딩',
    description: 'Cursor IDE를 활용한 효율적인 AI 기반 개발 워크플로우 마스터하기',
    technology: 'Cursor',
    difficulty: 'beginner',
    estimatedHours: 8,
    totalSteps: 12,
    completedSteps: 3,
    progress: 25,
    isEnrolled: true,
    tags: ['AI', 'IDE', 'Productivity'],
    instructor: 'AI 개발 전문가',
    rating: 4.8,
    students: 1247
  },
  {
    id: '2',
    title: 'Lovable로 웹앱 빌드하기',
    description: 'Lovable을 사용하여 React 웹 애플리케이션을 빠르게 개발하는 방법',
    technology: 'Lovable',
    difficulty: 'beginner',
    estimatedHours: 6,
    totalSteps: 10,
    completedSteps: 0,
    progress: 0,
    isEnrolled: false,
    tags: ['React', 'Web Development', 'No-Code'],
    instructor: '웹 개발자',
    rating: 4.9,
    students: 856
  },
  {
    id: '3',
    title: 'GitHub Copilot 마스터클래스',
    description: 'GitHub Copilot의 고급 기능과 최적화 팁으로 생산성 극대화',
    technology: 'GitHub Copilot',
    difficulty: 'intermediate',
    estimatedHours: 10,
    totalSteps: 15,
    completedSteps: 0,
    progress: 0,
    isEnrolled: false,
    tags: ['AI', 'Code Assistant', 'GitHub'],
    instructor: 'GitHub 전문가',
    rating: 4.7,
    students: 2341
  },
  {
    id: '4',
    title: 'Windsurf로 고급 개발하기',
    description: 'Windsurf의 고급 기능을 활용한 엔터프라이즈급 개발 방법론',
    technology: 'Windsurf',
    difficulty: 'advanced',
    estimatedHours: 15,
    totalSteps: 20,
    completedSteps: 0,
    progress: 0,
    isEnrolled: false,
    tags: ['Advanced', 'Enterprise', 'Best Practices'],
    instructor: '시니어 개발자',
    rating: 4.6,
    students: 423
  },
  {
    id: '5',
    title: 'AI 에이전트와 협업하기',
    description: 'Devin과 같은 AI 에이전트와 효과적으로 협업하는 방법',
    technology: 'Devin',
    difficulty: 'intermediate',
    estimatedHours: 12,
    totalSteps: 18,
    completedSteps: 0,
    progress: 0,
    isEnrolled: false,
    tags: ['AI Agent', 'Collaboration', 'Future'],
    instructor: 'AI 연구자',
    rating: 4.5,
    students: 678
  }
]

export default function Learning() {
  const { user } = useAuth()
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>(samplePaths)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  const filteredPaths = learningPaths.filter(path => 
    selectedDifficulty === 'all' || path.difficulty === selectedDifficulty
  )

  const enrolledPaths = learningPaths.filter(path => path.isEnrolled)
  const completedPaths = learningPaths.filter(path => path.progress === 100)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500'
      case 'intermediate':
        return 'bg-yellow-500'
      case 'advanced':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '초급'
      case 'intermediate':
        return '중급'
      case 'advanced':
        return '고급'
      default:
        return difficulty
    }
  }

  const handleEnroll = (pathId: string) => {
    if (!user) {
      // Redirect to auth
      window.location.href = '/auth'
      return
    }

    setLearningPaths(prev => prev.map(path => 
      path.id === pathId ? { ...path, isEnrolled: true } : path
    ))
  }

  const PathCard = ({ path }: { path: LearningPath }) => (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg">{path.title}</CardTitle>
            <CardDescription>{path.description}</CardDescription>
            <div className="flex items-center gap-2">
              <Badge className={getDifficultyColor(path.difficulty)}>
                {getDifficultyText(path.difficulty)}
              </Badge>
              <Badge variant="outline">{path.technology}</Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {path.estimatedHours}시간
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {path.totalSteps}단계
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            {path.rating}
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {path.students.toLocaleString()}명
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {path.isEnrolled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>진행률</span>
              <span>{path.completedSteps}/{path.totalSteps}</span>
            </div>
            <Progress value={path.progress} className="w-full" />
          </div>
        )}
        
        <div className="flex flex-wrap gap-1">
          {path.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="text-sm text-muted-foreground">
          강사: {path.instructor}
        </div>
        
        {path.isEnrolled ? (
          <Button className="w-full">
            <Play className="mr-2 h-4 w-4" />
            계속하기
          </Button>
        ) : (
          <Button 
            className="w-full" 
            variant="outline"
            onClick={() => handleEnroll(path.id)}
          >
            수강하기
          </Button>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">AI 코딩 학습 경로</h1>
        <p className="text-muted-foreground">
          최신 AI 코딩 도구들을 체계적으로 학습하고 마스터하세요
        </p>
      </div>

      {/* Stats */}
      {user && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">수강 중인 강좌</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enrolledPaths.length}</div>
              <p className="text-xs text-muted-foreground">개의 강좌</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">완료한 강좌</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedPaths.length}</div>
              <p className="text-xs text-muted-foreground">개의 강좌</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 진행률</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {enrolledPaths.length > 0 
                  ? Math.round(enrolledPaths.reduce((sum, path) => sum + path.progress, 0) / enrolledPaths.length)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">전체 평균</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Learning Paths */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">모든 강좌</TabsTrigger>
          {user && <TabsTrigger value="enrolled">수강 중</TabsTrigger>}
          <TabsTrigger value="beginner">초급</TabsTrigger>
          <TabsTrigger value="intermediate">중급</TabsTrigger>
          <TabsTrigger value="advanced">고급</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learningPaths.map((path) => (
              <PathCard key={path.id} path={path} />
            ))}
          </div>
        </TabsContent>
        
        {user && (
          <TabsContent value="enrolled" className="space-y-4">
            {enrolledPaths.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledPaths.map((path) => (
                  <PathCard key={path.id} path={path} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">수강 중인 강좌가 없습니다</h3>
                  <p className="text-muted-foreground mb-4">
                    관심 있는 강좌를 수강하여 AI 코딩 스킬을 향상시켜보세요
                  </p>
                  <Button onClick={() => setSelectedDifficulty('all')}>
                    강좌 둘러보기
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
        
        <TabsContent value="beginner" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learningPaths.filter(path => path.difficulty === 'beginner').map((path) => (
              <PathCard key={path.id} path={path} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="intermediate" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learningPaths.filter(path => path.difficulty === 'intermediate').map((path) => (
              <PathCard key={path.id} path={path} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learningPaths.filter(path => path.difficulty === 'advanced').map((path) => (
              <PathCard key={path.id} path={path} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Popular Technologies */}
      <Card>
        <CardHeader>
          <CardTitle>인기 기술 트렌드</CardTitle>
          <CardDescription>
            현재 가장 인기 있는 AI 코딩 기술들입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {['Cursor', 'Lovable', 'GitHub Copilot', 'Windsurf', 'Devin', 'Bolt.new'].map((tech) => (
              <Button key={tech} variant="outline" className="justify-start">
                {tech}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}