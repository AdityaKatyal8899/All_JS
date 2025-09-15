class Solution:
    def isNumber(self, s: str) -> bool:
        n = len(s)

        if n == 0: 
            return False
        
        if n == 1:
            return s[0].isdigit()
        
        if s[0] == " " or s[n-1] == " ":
            return False

        if s[n-1] in {'e', 'E', '+', '-'}:
            return False

        if s[n-1] == '.' and not any(ch.isdigit() for ch in s[:-1]):
            return False

        if ' ' in s:
            return False

        seenDigi = False
        seenDot = False
        seenExp = False

        for i, j in enumerate(s):
            if j.isdigit():
                seenDigi = True

            elif j == ".":
                if seenDot or seenExp:
                    return False
                seenDot = True

            elif j in {'e', 'E'}:
                if seenExp or not seenDigi:
                    return False
                seenExp = True
                seenDigi = False

            elif j in {'+', '-'}:
                if i != 0 and s[i-1] not in {'e', 'E'}:
                    return False

            else:
                return False

        return seenDigi 

s =Solution()

n= input("Enter: ")

print(s.isNumber(n))